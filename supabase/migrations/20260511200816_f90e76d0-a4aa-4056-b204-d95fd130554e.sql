UPDATE products
SET variants = (
  SELECT jsonb_agg(
    CASE 
      WHEN (v.value->>'image' IS NULL OR v.value->>'image' = '') AND images[v.ord] IS NOT NULL
      THEN jsonb_set(v.value, '{image}', to_jsonb(images[v.ord]))
      ELSE v.value
    END
    ORDER BY v.ord
  )
  FROM jsonb_array_elements(variants) WITH ORDINALITY AS v(value, ord)
)
WHERE jsonb_typeof(variants) = 'array'
  AND jsonb_array_length(variants) > 0
  AND array_length(images, 1) >= jsonb_array_length(variants)
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(variants) v
    WHERE v->>'image' IS NOT NULL AND v->>'image' <> ''
  );