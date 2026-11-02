insert into public.crop_catalog (name, scientific_name, supported_seasons, suitable_soil_types, image_reference, description, source_reference)
values
  ('Rice', 'Oryza sativa', '["Kharif"]', '["Black", "Alluvial", "Clay"]', '/images/crop-detail.jpg', 'Demonstration catalog entry. Confirm variety, planting date and local conditions before use.', 'FarmWiseAI demonstration seed; not a verified agronomic recommendation'),
  ('Groundnut', 'Arachis hypogaea', '["Kharif"]', '["Sandy", "Loamy", "Red"]', '/images/crop-detail.jpg', 'Demonstration catalog entry. Confirm regional suitability with local agricultural guidance.', 'FarmWiseAI demonstration seed; not a verified agronomic recommendation'),
  ('Pearl millet', 'Cenchrus americanus', '["Kharif"]', '["Sandy", "Red", "Desert / arid"]', '/images/farm-field.jpg', 'Demonstration catalog entry. This data is not a yield, disease or profitability forecast.', 'FarmWiseAI demonstration seed; not a verified agronomic recommendation')
on conflict (name) do nothing;
