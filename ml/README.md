# FarmWiseAI Vision v1 training pipeline

This directory contains a reproducible, CPU-compatible MobileNetV3-Small pipeline. It does not download data automatically, include datasets or weights in Git, or change the production pest UI.

## Requirements

Python 3.11–3.13 is recommended for the PyTorch/Torchvision stack. Install the pinned runtime dependencies in your selected environment:

```powershell
python -m pip install torch torchvision scikit-learn pillow onnx onnxruntime
```

The current repository audit environment is Python 3.14. If a compatible Torch wheel is unavailable there, use a supported environment before training.

## Configuration

Copy [config.example.json](./config.example.json) to an external or local working config and set `dataset_root` plus each source `root` to directories under `FARMWISE_DATA_DIR`. Keep the actual config and data outside Git when it contains machine-specific paths.

Each source maps its original directory labels explicitly to FarmWiseAI labels. A source may be excluded by setting `enabled` to false. Files with augmentation tokens are excluded by default; the loader also groups exact duplicates and inferred related filenames to avoid split leakage.

## Smoke test

The smoke test uses random tensors and `weights=None`. It validates model construction, preprocessing shape, PyTorch forward output, ONNX export, ONNX Runtime execution, and numerical parity. It is not a training result.

```powershell
python ml/train.py --config ml/config.example.json --smoke --run-dir ml/runs/smoke
```

## Training and evaluation

After the dataset gates pass and the config names an eligible source:

```powershell
python ml/train.py --config path\to\farmwise-training.json --train --run-dir ml/runs/baseline-v1
```

The command writes a checkpoint, metadata, per-class metrics, confusion-matrix CSV, split counts, and an ONNX artifact only when export and parity verification pass. Validation is used for checkpoint selection. The held-out test split is evaluated once after selection.

[inference.py](./inference.py) provides the same 224 × 224 normalization for ONNX inference and a conservative confidence/margin rejection wrapper. Its thresholds are raw-score heuristics until calibration and unknown-input evaluation are completed; it must not be treated as a validated unknown-disease detector.

Training is intentionally modest and configurable: fixed seed, AdamW, early stopping, no hyperparameter search. The output softmax values are not calibrated probabilities, and no unknown-disease rejection claim is made by this baseline.

## Data and legal gate

Use [../docs/pest-model-readiness.md](../docs/pest-model-readiness.md), [data/dataset_registry.md](./data/dataset_registry.md), [data/coverage_matrix.md](./data/coverage_matrix.md), and [data/split_strategy.md](./data/split_strategy.md) before enabling a class. Training on application demo images or synthetic images is not permitted. Synthetic tensors are used only by the smoke test.
