"""Read-only image integrity and leakage audit for external FarmWiseAI datasets."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
AUGMENTED_TOKEN = re.compile(r"(?:^|[_-])(aug|augment|augmented|flip|flipped|rotate|rotated|zoom|contrast|brightness|shear|crop)(?:[_-]|$)", re.I)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def inspect_image(path: Path) -> dict[str, Any]:
    try:
        from PIL import Image

        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            return {"valid": True, "width": image.width, "height": image.height, "format": image.format}
    except ImportError:
        return {"valid": None, "error": "Pillow is not installed; install it to validate image bytes and dimensions."}
    except Exception as error:  # Pillow raises format-specific exceptions.
        return {"valid": False, "error": str(error)[:240]}


def average_hash(path: Path) -> str | None:
    try:
        from PIL import Image

        with Image.open(path) as image:
            image = image.convert("L").resize((8, 8))
            pixels = list(image.getdata())
        average = sum(pixels) / len(pixels)
        return "".join("1" if pixel >= average else "0" for pixel in pixels)
    except Exception:
        return None


def hamming(left: str, right: str) -> int:
    return sum(a != b for a, b in zip(left, right))


def inferred_group(relative: Path) -> str:
    stem = relative.stem.lower()
    stem = AUGMENTED_TOKEN.sub("_", stem)
    stem = re.sub(r"(?:[_-](?:copy|v\d+|\d+))+$", "", stem)
    return f"{relative.parent.as_posix()}::{stem}"


def audit(root: Path) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    exact: defaultdict[str, list[str]] = defaultdict(list)
    perceptual: defaultdict[str, list[str]] = defaultdict(list)
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        relative = path.relative_to(root)
        inspected = inspect_image(path)
        file_hash = sha256_file(path)
        phash = average_hash(path)
        record = {
            "path": relative.as_posix(),
            "class": relative.parent.name,
            "source_group": relative.parts[0] if relative.parts else "root",
            "bytes": path.stat().st_size,
            "sha256": file_hash,
            "perceptual_hash": phash,
            "likely_augmented": bool(AUGMENTED_TOKEN.search(path.name) or AUGMENTED_TOKEN.search(relative.parent.name)),
            "inferred_group": inferred_group(relative),
            **inspected,
        }
        records.append(record)
        exact[file_hash].append(relative.as_posix())
        if phash:
            perceptual[phash].append(relative.as_posix())

    near_duplicates: list[dict[str, Any]] = []
    buckets: defaultdict[tuple[int, str], list[str]] = defaultdict(list)
    for value in perceptual:
        for band in range(4):
            buckets[(band, value[band * 16 : (band + 1) * 16])].append(value)
    candidate_pairs: set[tuple[str, str]] = set()
    for values in buckets.values():
        for index, left in enumerate(values):
            for right in values[index + 1 :]:
                candidate_pairs.add(tuple(sorted((left, right))))
    for left, right in candidate_pairs:
        distance = hamming(left, right)
        if 0 < distance <= 6:
            near_duplicates.append({"distance": distance, "paths": perceptual[left] + perceptual[right]})

    class_counts = Counter(record["class"] for record in records)
    invalid = [record for record in records if record.get("valid") is False]
    exact_groups = [paths for paths in exact.values() if len(paths) > 1]
    inferred_group_counts = Counter(record["inferred_group"] for record in records)
    return {
        "root": str(root),
        "image_count": len(records),
        "class_counts": dict(sorted(class_counts.items())),
        "format_counts": dict(sorted(Counter(record.get("format", "unknown") for record in records).items())),
        "dimension_counts": dict(sorted(Counter(f'{record.get("width", "?")}x{record.get("height", "?")}' for record in records).items())),
        "corrupt_or_unreadable": invalid,
        "exact_duplicate_groups": exact_groups,
        "near_duplicate_pairs_or_groups": near_duplicates,
        "near_duplicate_search": "four 16-bit locality-sensitive hash bands; candidates only, not proof of identity",
        "likely_augmented_count": sum(record["likely_augmented"] for record in records),
        "inferred_leakage_groups_with_multiple_files": {group: count for group, count in inferred_group_counts.items() if count > 1},
        "pillow_validation": "available" if any(record.get("valid") is not None for record in records) else "unavailable",
        "records": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default=os.environ.get("FARMWISE_DATA_DIR"))
    parser.add_argument("--output", default="ml/data/audit_report.json")
    args = parser.parse_args()
    if not args.data_dir:
        parser.error("provide --data-dir or set FARMWISE_DATA_DIR")
    root = Path(args.data_dir).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"dataset directory does not exist: {root}")
    report = audit(root)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("root", "image_count", "class_counts", "corrupt_or_unreadable", "exact_duplicate_groups", "near_duplicate_pairs_or_groups")}, indent=2))


if __name__ == "__main__":
    main()
