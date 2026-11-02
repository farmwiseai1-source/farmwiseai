"""Reproducible MobileNetV3-Small training, evaluation, export and smoke tests."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import random
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
AUGMENTED_TOKEN = re.compile(r"(?:^|[_-])(aug|augment|augmented|flip|flipped|rotate|rotated|zoom|contrast|brightness|shear|crop)(?:[_-]|$)", re.I)


@dataclass(frozen=True)
class Sample:
    path: str
    label: str
    group: str
    source: str
    sha256: str
    likely_augmented: bool


def require_runtime() -> dict[str, Any]:
    try:
        import torch
        import torchvision
        from PIL import Image
        from sklearn.metrics import confusion_matrix, precision_recall_fscore_support
    except ImportError as error:
        raise RuntimeError("Training requires torch, torchvision, Pillow and scikit-learn. Install ml/README.md dependencies.") from error
    return {"torch": torch, "torchvision": torchvision, "Image": Image, "confusion_matrix": confusion_matrix, "metrics": precision_recall_fscore_support}


def set_seed(seed: int, torch: Any) -> None:
    random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def inferred_group(relative: Path, digest: str) -> str:
    stem = AUGMENTED_TOKEN.sub("_", relative.stem.lower())
    stem = re.sub(r"(?:[_-](?:copy|v\d+|\d+))+$", "", stem)
    return f"{relative.parent.as_posix()}::{stem}::sha:{digest}"


def collect_samples(config: dict[str, Any]) -> list[Sample]:
    samples: list[Sample] = []
    for source in config.get("sources", []):
        if not source.get("enabled", True):
            continue
        root = Path(os.path.expandvars(source["root"])).expanduser().resolve()
        if not root.is_dir():
            raise FileNotFoundError(f"enabled dataset source does not exist: {root}")
        mapping = source.get("class_mapping", {})
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            relative = path.relative_to(root)
            original_label = relative.parent.name
            label = mapping.get(original_label)
            if label is None:
                continue
            likely_augmented = bool(AUGMENTED_TOKEN.search(path.name) or AUGMENTED_TOKEN.search(original_label))
            if source.get("original_only", True) and likely_augmented:
                continue
            digest = sha256_file(path)
            samples.append(Sample(str(path), label, inferred_group(relative, digest), source["id"], digest, likely_augmented))
    if not samples:
        raise ValueError("No mapped original images were found in enabled dataset sources.")
    return samples


def split_samples(samples: list[Sample], config: dict[str, Any], seed: int) -> dict[str, list[Sample]]:
    proportions = config.get("split", {"train": 0.7, "validation": 0.15, "test": 0.15})
    groups: dict[str, list[Sample]] = {}
    for sample in samples:
        groups.setdefault(sample.group, []).append(sample)
    assignments: dict[str, str] = {}
    for group in sorted(groups, key=lambda value: hashlib.sha256(f"{seed}:{value}".encode()).hexdigest()):
        fraction = int(hashlib.sha256(f"{seed}:{group}".encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
        if fraction < proportions["train"]:
            assignments[group] = "train"
        elif fraction < proportions["train"] + proportions["validation"]:
            assignments[group] = "validation"
        else:
            assignments[group] = "test"
    result = {"train": [], "validation": [], "test": []}
    for group, members in groups.items():
        result[assignments[group]].extend(members)
    if not all(result.values()):
        raise ValueError("Group split produced an empty partition; add independent source groups or adjust the split.")
    return result


def build_transforms(runtime: dict[str, Any], image_size: int, training: bool) -> Any:
    transforms = runtime["torchvision"].transforms
    operations = [transforms.Resize((image_size, image_size))]
    if training:
        operations.extend([transforms.RandomHorizontalFlip(), transforms.RandomRotation(10)])
    operations.extend([transforms.ToTensor(), transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
    return transforms.Compose(operations)


def make_model(runtime: dict[str, Any], class_count: int, pretrained: bool) -> Any:
    models = runtime["torchvision"].models
    weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v3_small(weights=weights)
    model.classifier[-1] = runtime["torch"].nn.Linear(model.classifier[-1].in_features, class_count)
    return model


def smoke_test(config: dict[str, Any], run_dir: Path) -> dict[str, Any]:
    runtime = require_runtime()
    torch = runtime["torch"]
    model = make_model(runtime, len(config["classes"]), pretrained=False).eval()
    image_size = int(config.get("image_size", 224))
    tensor = torch.randn(1, 3, image_size, image_size)
    with torch.no_grad():
        output = model(tensor)
    run_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = run_dir / "mobilenetv3_small_smoke.onnx"
    torch.onnx.export(model, tensor, onnx_path, input_names=["image"], output_names=["logits"], opset_version=17, dynamo=False)
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
        onnx_output = session.run(["logits"], {"image": tensor.numpy()})[0]
        max_error = float((output.numpy() - onnx_output).max())
        parity = max_error < 1e-4
    except ImportError as error:
        raise RuntimeError("ONNX smoke test requires onnxruntime.") from error
    result = {"mode": "smoke", "model_version": config.get("model_version", "unversioned"), "classes": config["classes"], "input_shape": list(tensor.shape), "output_shape": list(output.shape), "onnx": str(onnx_path), "max_abs_error": max_error, "parity_passed": parity}
    (run_dir / "smoke_metadata.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    if not parity:
        raise RuntimeError(f"ONNX parity failed: max absolute error {max_error}")
    return result


def train_model(config: dict[str, Any], run_dir: Path) -> dict[str, Any]:
    runtime = require_runtime()
    torch = runtime["torch"]
    set_seed(int(config.get("seed", 0)), torch)
    classes = list(config["classes"])
    class_index = {name: index for index, name in enumerate(classes)}
    samples = collect_samples(config)
    splits = split_samples(samples, config, int(config.get("seed", 0)))

    class Dataset(torch.utils.data.Dataset):
        def __init__(self, items: list[Sample], transform: Any) -> None:
            self.items, self.transform = items, transform
        def __len__(self) -> int:
            return len(self.items)
        def __getitem__(self, index: int) -> tuple[Any, int]:
            item = self.items[index]
            image = runtime["Image"].open(item.path).convert("RGB")
            return self.transform(image), class_index[item.label]

    image_size = int(config.get("image_size", 224))
    loaders = {}
    for name, items in splits.items():
        dataset = Dataset(items, build_transforms(runtime, image_size, name == "train"))
        loaders[name] = torch.utils.data.DataLoader(dataset, batch_size=int(config.get("batch_size", 16)), shuffle=name == "train", num_workers=int(config.get("num_workers", 0)))
    model = make_model(runtime, len(classes), bool(config.get("pretrained", True)))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(config.get("learning_rate", 3e-4)), weight_decay=float(config.get("weight_decay", 1e-4)))
    loss_function = torch.nn.CrossEntropyLoss()
    best_loss, best_epoch, stale = float("inf"), -1, 0
    run_dir.mkdir(parents=True, exist_ok=True)
    history: list[dict[str, Any]] = []
    for epoch in range(int(config.get("epochs", 8))):
        model.train()
        train_loss = 0.0
        for images, labels in loaders["train"]:
            optimizer.zero_grad(set_to_none=True)
            loss = loss_function(model(images.to(device)), labels.to(device))
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(labels)
        model.eval()
        validation_loss = 0.0
        with torch.no_grad():
            for images, labels in loaders["validation"]:
                validation_loss += loss_function(model(images.to(device)), labels.to(device)).item() * len(labels)
        record = {"epoch": epoch + 1, "train_loss": train_loss / len(splits["train"]), "validation_loss": validation_loss / len(splits["validation"])}
        history.append(record)
        if record["validation_loss"] < best_loss:
            best_loss, best_epoch, stale = record["validation_loss"], epoch + 1, 0
            torch.save({"state_dict": model.state_dict(), "classes": classes, "config": config, "best_epoch": best_epoch}, run_dir / "best.pt")
        else:
            stale += 1
            if stale >= int(config.get("patience", 2)):
                break

    checkpoint = torch.load(run_dir / "best.pt", map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["state_dict"])
    predictions, targets = [], []
    model.eval()
    with torch.no_grad():
        for images, labels in loaders["test"]:
            predictions.extend(model(images.to(device)).argmax(dim=1).cpu().tolist())
            targets.extend(labels.tolist())
    precision, recall, f1, support = runtime["metrics"](targets, predictions, labels=list(range(len(classes))), zero_division=0)
    matrix = runtime["confusion_matrix"](targets, predictions, labels=list(range(len(classes))))
    metrics = {"classes": classes, "per_class": {name: {"precision": float(precision[index]), "recall": float(recall[index]), "f1": float(f1[index]), "support": int(support[index])} for index, name in enumerate(classes)}, "macro_f1": float(f1.mean()), "test_count": len(targets), "best_epoch": best_epoch}
    with (run_dir / "confusion_matrix.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["true\\pred", *classes])
        for name, row in zip(classes, matrix.tolist()):
            writer.writerow([name, *row])
    metadata = {"mode": "training", "model_version": config.get("model_version", "unversioned"), "architecture": "MobileNetV3-Small", "pretrained": bool(config.get("pretrained", True)), "device": str(device), "class_count": len(classes), "history": history, "split_counts": {name: len(items) for name, items in splits.items()}, "metrics": metrics, "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    (run_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--train", action="store_true")
    args = parser.parse_args()
    if args.smoke == args.train:
        parser.error("choose exactly one of --smoke or --train")
    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    result = smoke_test(config, Path(args.run_dir)) if args.smoke else train_model(config, Path(args.run_dir))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
