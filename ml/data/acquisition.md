# Dataset acquisition instructions

Set a data directory outside the repository. PowerShell example:

```powershell
$env:FARMWISE_DATA_DIR = 'D:\FarmWiseAI\datasets'
```

Run `ml/data/acquire_datasets.ps1` only after reviewing each source license. The script skips PlantVillage by default because its original-source license is unresolved; pass `-IncludePlantVillage` only after rights are confirmed. The script does not download Mendeley records automatically because the public landing pages require a manual download step and the exact archive metadata must be recorded by the operator.

## Automated source access

- PlantVillage: clone the official GitHub repository or use the source-linked Hugging Face loader after resolving the original image license. Do not use a Kaggle mirror as the legal source.
- PlantDoc: clone the official classification repository. Review the repository CC BY 4.0 notice and the underlying scraped-image rights before commercial use.

## Manual source access

Download these exact versions from their Mendeley records, then record the archive filename, byte size and SHA-256:

- RiceLeafDiseaseBD v3: https://data.mendeley.com/datasets/86s4jzj2m4/3
- Chili Krishna River Basin v3: https://data.mendeley.com/datasets/ymt8k9bjkn/3
- MGLeaf-Disease v2: https://data.mendeley.com/datasets/7m8n4ym4nm/2

After extraction, run:

```powershell
corepack pnpm exec python ml/tools/audit_images.py --data-dir $env:FARMWISE_DATA_DIR --output ml/data/audit_report.json
```

The audit is read-only and does not delete, rename or modify source images.

For downloaded archives, record checksums with:

```powershell
Get-ChildItem $env:FARMWISE_DATA_DIR -File -Include *.zip,*.tar,*.gz -Recurse |
  Get-FileHash -Algorithm SHA256 |
  Export-Csv ml/data/archive_checksums.csv -NoTypeInformation
```
