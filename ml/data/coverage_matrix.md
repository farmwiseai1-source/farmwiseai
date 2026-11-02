# FarmWiseAI class coverage matrix

Legend: `COVERED` means a source label matches the contract exactly enough for review; `AMBIGUOUS` means evidence is needed before mapping; `MISSING` means no candidate source currently supplies the class; `HOLD` means license/provenance prevents approval.

| Required class | PlantVillage | PlantDoc | RiceLeafDiseaseBD v3 | Chili Krishna v3 | MGLeaf-Disease v2 | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Rice healthy | MISSING | UNKNOWN | COVERED | MISSING | MISSING | review |
| Rice blast | MISSING | UNKNOWN | COVERED | MISSING | MISSING | review |
| Rice brown spot | MISSING | UNKNOWN | COVERED | MISSING | MISSING | review |
| Rice bacterial leaf blight | MISSING | UNKNOWN | MISSING | MISSING | MISSING | GAP |
| Tomato healthy | COVERED/HOLD | UNKNOWN | MISSING | MISSING | MISSING | license hold |
| Tomato early blight | COVERED/HOLD | UNKNOWN | MISSING | MISSING | MISSING | license hold |
| Tomato late blight | COVERED/HOLD | UNKNOWN | MISSING | MISSING | MISSING | license hold |
| Tomato leaf mold | COVERED/HOLD | UNKNOWN | MISSING | MISSING | MISSING | license hold |
| Mango healthy | MISSING | UNKNOWN | MISSING | MISSING | AMBIGUOUS (two labels) | mapping gap |
| Mango anthracnose | MISSING | UNKNOWN | MISSING | MISSING | COVERED | review |
| Mango powdery mildew | MISSING | UNKNOWN | MISSING | MISSING | COVERED | review |
| Chilli healthy | MISSING | UNKNOWN | MISSING | COVERED | MISSING | review |
| Chilli leaf curl symptoms | MISSING | UNKNOWN | MISSING | AMBIGUOUS (`Curl Virus`) | MISSING | do not merge yet |
| Chilli leaf spot | MISSING | UNKNOWN | MISSING | AMBIGUOUS (`Cercospora Leaf Spot`) | MISSING | do not merge yet |
| Groundnut healthy | MISSING | UNKNOWN | MISSING | MISSING | COVERED | review |
| Groundnut tikka/late leaf spot | MISSING | UNKNOWN | MISSING | MISSING | AMBIGUOUS (`LateLeafSpot`) | agronomic mapping needed |
| Groundnut rust | MISSING | UNKNOWN | MISSING | MISSING | COVERED | review |

## Conflicts and gaps

- RiceLeafDiseaseBD supplies field rice classes but not bacterial leaf blight, so the contract cannot be advertised as complete for rice.
- The chilli dataset reports 1,856 originals and 12,000 augmented images. Augmented derivatives cannot be counted as independent evidence or placed in a separate evaluation split.
- MGLeaf-Disease has two mango healthy directory names and uses `EarlyLeafspot`/`LateLeafSpot`; neither ambiguity may be resolved by string matching alone.
- PlantVillage covers tomato candidates but its original dataset license is unresolved in the source repository, so those classes are not legally approved.
- PlantDoc’s source README gives totals and a CC BY repository license but does not enumerate the exact class mapping in the landing README; the local audit must establish it after download.
- None of the current candidates supplies all five crops and all required condition classes with approved labels.
