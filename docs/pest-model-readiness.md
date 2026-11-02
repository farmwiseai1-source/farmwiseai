# FarmWiseAI pest-model readiness contract

This document defines the gate for replacing the current pest-detection demonstration with a real model. It does not claim that a model is trained or that any disease class is currently supported.

## Proposed baseline

- Architecture: MobileNetV3-Small, pretrained on ImageNet and fine-tuned with reproducible training code.
- Input: RGB image, resized and normalized to 224 × 224.
- Inference format: ONNX Runtime behind a server-side endpoint.
- Model outputs: crop classification, crop-specific condition classification, calibrated confidence, and a rejection reason.
- Initial crop scope: rice, tomato, mango, chilli, and groundnut.
- Required non-diagnosis outcomes: other crop, non-plant, unclear image, and unknown condition.

The proposed condition classes are only candidates until each class has trustworthy labeled data:

| Crop | Candidate classes |
| --- | --- |
| Rice | healthy, blast, brown spot, bacterial leaf blight |
| Tomato | healthy, early blight, late blight, leaf mold |
| Mango | healthy, anthracnose, powdery mildew |
| Chilli | healthy, leaf curl symptoms, leaf spot |
| Groundnut | healthy, tikka/late leaf spot, rust |

## Dataset gate

PlantVillage is the reproducible baseline source. PlantDoc and crop-specific field datasets are required for field robustness. A class may be advertised only after its label definition, source licence, crop, geography, and minimum image count are recorded.

Training and test splits must be grouped by source, farm, or collection session so near-duplicate images cannot cross the split. The final test set must contain unseen field-like images.

## Rejection behavior

The service must reject an image when quality checks fail, no supported crop is detected, the condition is outside the trained class set, or calibrated confidence/margin thresholds are not met. The response must say that no reliable diagnosis was made; it must not map an unknown image to the top softmax class.

## Deployment gate

Before enabling production inference, record:

1. Per-class precision, recall, F1, confusion matrix, and calibration results.
2. Unknown/unclear rejection rate and false-accept rate.
3. P50/P95 end-to-end latency, memory, cold start, and cost on the target host.
4. Maximum accepted upload size and private-storage behavior.
5. Model version, dataset version, preprocessing version, and prediction timestamp in the existing pest-report record.

Until all gates pass, the UI must remain explicitly demonstrational and must not present a disease or pest diagnosis.
