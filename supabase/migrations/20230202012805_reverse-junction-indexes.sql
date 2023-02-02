-- indexes on the reverse direction of the primary keys in junction tables

CREATE INDEX IF NOT EXISTS protein_species_reverse_idx ON public.protein_species (species_id, protein_id);
CREATE INDEX IF NOT EXISTS protein_reaction_reverse_idx ON public.protein_reaction (reaction_id, protein_id);

-- indexes on all the foreign keys we might search on

CREATE INDEX IF NOT EXISTS synonym_chemical_id_idx ON public.synonym (chemical_id);
CREATE INDEX IF NOT EXISTS synonym_reaction_id_idx ON public.synonym (reaction_id);
CREATE INDEX IF NOT EXISTS synonym_protein_id_idx ON public.synonym (protein_id);
CREATE INDEX IF NOT EXISTS synonym_species_id_idx ON public.synonym (species_id);

CREATE INDEX IF NOT EXISTS stoichiometry_reaction_id_idx ON public.stoichiometry (reaction_id);
