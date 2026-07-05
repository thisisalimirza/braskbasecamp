-- Remove empty duplicate global facts when a filled row shares the same label.
DELETE FROM reference_facts
WHERE scope = 'global'
  AND trim(value) = ''
  AND EXISTS (
    SELECT 1 FROM reference_facts AS filled
    WHERE filled.scope = 'global'
      AND lower(trim(filled.label)) = lower(trim(reference_facts.label))
      AND trim(filled.value) != ''
      AND filled.id != reference_facts.id
  );
