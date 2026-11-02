# FarmWiseAI image audit report

Audit status: **not run against the candidate datasets**.

No external dataset archives are present in this repository or in a configured `FARMWISE_DATA_DIR` during this audit. Therefore there are no fabricated image counts, corruption results, duplicate results, or split assignments.

The audit implementation is [audit_images.py](../tools/audit_images.py). It is read-only and reports:

- image counts by inferred class directory;
- corrupt/unreadable images and dimensions when Pillow is available;
- exact SHA-256 duplicates;
- perceptual near-duplicates when Pillow is available;
- likely augmentation derivatives;
- inferred multi-file groups that require split co-location review.

Run after acquisition:

```powershell
$env:FARMWISE_DATA_DIR = 'D:\FarmWiseAI\datasets'
c:/python314/python.exe ml/tools/audit_images.py --data-dir $env:FARMWISE_DATA_DIR --output ml/data/audit_report.json
```

The report must be reviewed alongside source metadata before creating train/validation/test partitions. A successful script run alone does not approve licenses, labels, or field validity.
