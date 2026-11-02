# FarmWiseAI dataset registry — Vision v1 Milestone 2

Audit date: 2026-10-29. No dataset files were downloaded into this repository. The external data directory is configured with `FARMWISE_DATA_DIR` and must remain outside Git.

## Contract taxonomy

The readiness contract in [pest-model-readiness.md](../../docs/pest-model-readiness.md) proposes these classes:

- Rice: healthy, blast, brown spot, bacterial leaf blight
- Tomato: healthy, early blight, late blight, leaf mold
- Mango: healthy, anthracnose, powdery mildew
- Chilli: healthy, leaf curl symptoms, leaf spot
- Groundnut: healthy, tikka/late leaf spot, rust

These are candidate classes, not yet approved production labels.

## Registry

### PlantVillage original

- Source/version: [official GitHub repository](https://github.com/spMohanty/PlantVillage-Dataset), current repository; dataset introduced in 2016.
- Reported data: 54,306 images, 14 crop species, 26 diseases, 38 combinations.
- Target coverage: tomato is covered; rice, mango, chilli, and groundnut are not covered by the documented 14-species scope.
- Conditions: controlled/lab-style leaf images; unsuitable as the sole field-evaluation source.
- License: HOLD. The original GitHub repository does not provide a dataset license file. A mirror’s license must not be applied to the original images. Commercial use requires rights-holder confirmation.
- Acquisition: use the source-linked Hugging Face loader only after license review; do not use a Kaggle mirror as the legal source.
- Size: mirror-specific; record the actual downloaded archive checksum and size.

### PlantDoc original

- Source/version: [official Cropped-PlantDoc repository](https://github.com/pratikkayal/PlantDoc-Dataset), current repository; paper dataset 2020.
- Reported data: 2,598 images across 13 plant species and up to 17 disease classes.
- License: repository states CC BY 4.0. Because the images were scraped from the internet, image-level rights and commercial reuse must be reviewed separately.
- Conditions: non-laboratory images with varied backgrounds; useful for robustness testing.
- Target coverage: tomato likely overlaps, but exact class-to-crop mapping must be confirmed by running the audit script after download. No other target crop is approved from the source README alone.
- Acquisition: clone the official repository; do not use a rehosted mirror without preserving the source license and provenance.

### RiceLeafDiseaseBD v3

- Source/version: [Mendeley Data version 3](https://data.mendeley.com/datasets/86s4jzj2m4/3), DOI `10.17632/86s4jzj2m4.3`.
- Reported data: 9,769 high-resolution images and 21,460 bounding boxes.
- Classes: healthy, blast, brown spot, leaf smut, rice tungro, sheath blight.
- Conditions: smartphone field images from Gazipur, Dhaka, Bangladesh, Summer 2025; BRRI dhan28/dhan29 focus.
- License: CC BY 4.0 on the Mendeley record.
- Audit status: useful rice field source, but bacterial leaf blight is missing. The box annotations require a documented conversion policy before classification training.
- Acquisition: manual download from the Mendeley record; record archive checksum and exact downloaded file list.

### Chili Krishna River Basin v3

- Source/version: [Mendeley Data version 3](https://data.mendeley.com/datasets/ymt8k9bjkn/3), DOI `10.17632/ymt8k9bjkn.3`.
- Reported data: 1,856 original JPG images and 12,000 augmented images.
- Classes: bacterial spot, curl virus, Cercospora leaf spot, nutrition deficiency, white spot, healthy leaves.
- Conditions: field images from Karnataka and Andhra Pradesh, India, collected October 2024–February 2025 in natural daylight.
- License: CC BY 4.0 on the Mendeley record.
- Audit status: useful chilli field source. The proposed generic `leaf spot` label cannot be silently mapped to `Cercospora Leaf Spot`; nutrition deficiency should remain a separate non-disease condition or be excluded.
- Acquisition: manual download from Mendeley; use only original images for split assignment and regenerate augmentation in our pipeline.

### MGLeaf-Disease v2

- Source/version: [Mendeley Data version 2](https://data.mendeley.com/datasets/7m8n4ym4nm/2), DOI `10.17632/7m8n4ym4nm.2`.
- Reported data: version 1 description reports 91,438 images; version 2 removes the physical train/validation/test split and provides class directories.
- Classes: Anthracnose, Dieback, EarlyLeafspot, HealthyGroundnut, LateLeafSpot, MangoHealthy, MangoHealthyLeaf, PowderyMildew, Rust.
- Conditions: real-time mango and groundnut leaf imagery; detailed collection geography is not stated on the landing page.
- License: CC BY 4.0 on the Mendeley record.
- Audit status: useful source for mango and groundnut. Mango healthy labels require reconciliation. Early/late leaf spot must not be merged into `tikka/late leaf spot` without evidence.
- Acquisition: manual download from Mendeley; verify the version 2 file count against the version 1 reported total.

## Legal and provenance rule

Only the license attached to the actual original source record governs acquisition. Research papers, GitHub code, Kaggle mirrors, and Hugging Face cards may have different terms. Any conflict is a HOLD until the rights holder or source record resolves it.

## Current approval summary

| Dataset | Technical usefulness | Legal status | Training status |
| --- | --- | --- | --- |
| PlantVillage | Tomato baseline only; controlled images | Original terms unresolved | HOLD |
| PlantDoc | Field-like robustness; likely tomato overlap | CC BY repo, scraped-image rights review | CONDITIONAL |
| RiceLeafDiseaseBD v3 | Rice field data; blast/brown spot overlap | CC BY 4.0 | CONDITIONAL |
| Chili Krishna v3 | Chilli field data; exact label mapping needed | CC BY 4.0 | CONDITIONAL |
| MGLeaf-Disease v2 | Mango/groundnut coverage; healthy and spot conflicts | CC BY 4.0 | CONDITIONAL |

No source is approved for production training yet. See [dataset_manifest.json](./dataset_manifest.json) for machine-readable metadata.
