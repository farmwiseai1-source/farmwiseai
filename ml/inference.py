"""Server-side ONNX preprocessing and conservative rejection wrapper."""

from __future__ import annotations

from pathlib import Path
from typing import Any


def preprocess_image(path: str | Path, image_size: int = 224) -> Any:
    try:
        import torch
        from PIL import Image
        from torchvision import transforms
    except ImportError as error:
        raise RuntimeError("Inference preprocessing requires torch, torchvision and Pillow.") from error
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    with Image.open(path) as image:
        return transform(image.convert("RGB")).unsqueeze(0).to(dtype=torch.float32)


def predict_onnx(path: str | Path, model_path: str | Path, classes: list[str], confidence_threshold: float = 0.70, margin_threshold: float = 0.15) -> dict[str, Any]:
    try:
        import numpy as np
        import onnxruntime as ort
        import torch
    except ImportError as error:
        raise RuntimeError("ONNX inference requires numpy, onnxruntime and torch.") from error
    tensor = preprocess_image(path)
    session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    logits = session.run([session.get_outputs()[0].name], {session.get_inputs()[0].name: tensor.numpy()})[0][0]
    probabilities = torch.softmax(torch.from_numpy(np.asarray(logits)), dim=0).numpy()
    order = np.argsort(probabilities)[::-1]
    top_index = int(order[0])
    confidence = float(probabilities[top_index])
    margin = float(confidence - probabilities[int(order[1])]) if len(order) > 1 else confidence
    rejected = confidence < confidence_threshold or margin < margin_threshold
    return {
        "label": None if rejected else classes[top_index],
        "confidence": confidence,
        "margin": margin,
        "rejected": rejected,
        "rejection_reason": "low_raw_confidence_or_margin" if rejected else None,
        "note": "Raw softmax scores are not calibrated probabilities; thresholds require validation before production use.",
    }
