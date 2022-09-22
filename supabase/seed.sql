with rows as (
  INSERT INTO public.chemical (inchi, name)
  VALUES (
      'InChI=1S/C4H10N2O2/c5-2-1-3(6)4(7)8/h3H,1-2,5-6H2,(H,7,8)/t3-/m0/s1',
      'L-2,4-diaminobutanoic acid'
    )
  RETURNING id
)
INSERT INTO public.synonym (source, value, chemical_id)
SELECT 'chebi_id', '48950', id
FROM rows;
