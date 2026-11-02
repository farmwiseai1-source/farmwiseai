# Leakage-resistant dataset split strategy

1. Keep each dataset in its own immutable source directory under `${FARMWISE_DATA_DIR}`. Never delete or rewrite source files automatically.
2. Build a manifest row for every image containing source ID, relative path, class path, byte size, SHA-256, perceptual hash when available, capture/session metadata when available, and original/augmented status.
3. Assign groups before splitting. Prefer source-provided leaf/photo/session IDs; otherwise use metadata, file stems, directory lineage, and exact/near-duplicate clusters. All members of a group stay in one partition.
4. Use stratified group splits: 70% train, 15% validation, 15% held-out test when each class has enough independent groups. If a class is too small, mark it insufficient rather than duplicating it across partitions.
5. Keep all augmented derivatives with their original image’s partition. Do not evaluate on an augmented derivative of a training image.
6. Reserve a separate field-image evaluation set containing unseen farms/collection sessions. It must not be used for threshold tuning.
7. Report the number of independent groups, not only image counts, per class and partition.

The audit script reports exact duplicates and perceptual near-duplicates but cannot infer hidden capture sessions from pixels alone. A human review of metadata and source documentation is required before training approval.
