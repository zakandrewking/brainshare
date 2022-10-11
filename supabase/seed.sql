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

INSERT INTO public.chemical (inchi, name)
VALUES
  ('InChI=1S/C19H28O2/c1-18-9-7-13(20)11-12(18)3-4-14-15-5-6-17(21)19(15,2)10-8-16(14)18/h12,14-16H,3-11H2,1-2H3/t12-,14+,15+,16+,18+,19+/m1/s1','5beta-androstane-3,17-dione'),
  ('InChI=1S/C9H14N5O7P/c10-9-13-7-5(8(17)14-9)12-3(1-11-7)6(16)4(15)2-21-22(18,19)20/h4,6,15-16H,1-2H2,(H2,18,19,20)(H4,10,11,13,14,17)/t4-,6+/m1/s1','2-amino-4-hydroxy-6-(erythro-1,2,3-trihydroxypropyl)dihydropteridine phosphate'),
  ('InChI=1S/C9H18N4O4/c10-9(11)13-4-1-2-6(8(16)17)12-5-3-7(14)15/h6,12H,1-5H2,(H,14,15)(H,16,17)(H4,10,11,13)/t6-/m0/s1','N2-(2-carboxyethyl)arginine'),
  ('InChI=1S/C6H8O7/c7-3(8)1-2(5(10)11)4(9)6(12)13/h2,4,9H,1H2,(H,7,8)(H,10,11)(H,12,13)/p-3','1-hydroxytricarballylate'),
  ('InChI=1S/C13H22O/c1-10-6-5-9-13(3,4)12(10)8-7-11(2)14/h5-9H2,1-4H3','oxidized Latia luciferin'),
  ('InChI=1S/C4H10N2O2/c5-2-1-3(6)4(7)8/h3H,1-2,5-6H2,(H,7,8)/t3-/m0/s1','L-2,4-diaminobutanoic acid'),
  ('InChI=1S/C10H15N4O9P/c11-8(18)5-9(13-3-15)14(2-12-5)10-7(17)6(16)4(23-10)1-22-24(19,20)21/h2-4,6-7,10,16-17H,1H2,(H2,11,18)(H,13,15)(H2,19,20,21)/t4-,6-,7-,10-/m1/s1','1-(5''-phosphoribosyl)-5-formamido-4-imidazolecarboxamide'),
  ('InChI=1S/C5H9NO3/c6-3-1-2-4(7)5(8)9/h1-3,6H2,(H,8,9)/p-1','2-oxo-5-amino-pentanoate'),
  ('InChI=1S/C4H4N2O2/c7-3-1-2-5-4(8)6-3/h1-2H,(H2,5,6,7,8)','U'),
  ('InChI=1S/C2H5NO2/c3-1-2(4)5/h1,3H2,(H,4,5)','G'),
  ('InChI=1S/C8H6O4/c9-6-3-1-5(2-4-6)7(10)8(11)12/h1-4,9H,(H,11,12)','4-hydroxyphenylglyoxylate'),
  ('InChI=1S/C16H12O5/c1-20-11-4-2-9(3-5-11)12-8-21-14-7-10(17)6-13(18)15(14)16(12)19/h2-8,17-18H,1H3','olmelin'),
  ('InChI=1S/C21H42N7O15P/c1-5-21(35,4-30)16(42-17-9(26-2)12(33)10(31)6(3-29)40-17)18(39-5)41-14-7(27-19(22)23)11(32)8(28-20(24)25)15(13(14)34)43-44(36,37)38/h5-18,26,29-35H,3-4H2,1-2H3,(H4,22,23,27)(H4,24,25,28)(H2,36,37,38)/t5-,6-,7-,8+,9-,10-,11-,12-,13-,14+,15-,16-,17-,18-,21+/m0/s1','O-2-deoxy-2-(methylamino)-alpha-L-glucopyranosyl-(1-2)-O-5-deoxy-3-C-(hydroxymethyl)-alpha-L-lyxofuranosyl-(1-4)-N,N''-bis(aminoiminomethyl)-D-streptamine-6-(dihydrogen phosphate)'),
  ('InChI=1S/C6H12O4/c1-4(8)6(10)2-5(9)3-7/h3-6,8-10H,2H2,1H3/t4-,5-,6-/m0/s1','3,6-deoxy-L-galactose'),
  ('InChI=1S/C6H12O5/c7-1-4-6(10)5(9)3(8)2-11-4/h3-10H,1-2H2/t3-,4+,5+,6+/m0/s1','1,5-anhydroglucitol'),
  ('InChI=1S/C7H6O4/c8-5-3-1-2-4(6(5)9)7(10)11/h1-3,8-9H,(H,10,11)','2,3-dihydroxybenzoic acid'),
  ('InChI=1S/C12H21N3O3/c1-8-5-7-14-10(8)11(16)15-6-3-2-4-9(13)12(17)18/h7-10H,2-6,13H2,1H3,(H,15,16)(H,17,18)/t8-,9+,10-/m1/s1','pyrrolysine'),
  ('InChI=1S/C27H46O/c1-18(2)7-6-8-19(3)23-11-12-24-22-10-9-20-17-21(28)13-15-26(20,4)25(22)14-16-27(23,24)5/h18-20,22-25H,6-17H2,1-5H3/t19-,20-,22+,23-,24+,25+,26+,27-/m1/s1','5beta-cholestan-3-one'),
  ('InChI=1S/C21H24NO4/c1-22-7-6-14-9-19-20(26-12-25-19)10-15(14)17(22)8-13-4-5-18(23-2)21(24-3)16(13)11-22/h4-5,9-10,17H,6-8,11-12H2,1-3H3/q+1/t17-,22?/m0/s1','(S)-N-methylcanadine'),
  ('InChI=1S/C18H24O2/c1-18-9-8-14-13-5-3-12(19)10-11(13)2-4-15(14)16(18)6-7-17(18)20/h3,5,10,14-17,19-20H,2,4,6-9H2,1H3/t14-,15-,16+,17-,18+/m1/s1','estra-1,3,5(10)trien-3,17alpha-diol'),
  ('InChI=1S/C24H42O21/c25-1-6-10(28)14(32)17(35)21(41-6)39-3-8-11(29)15(33)18(36)22(42-8)40-4-9-12(30)16(34)19(37)23(43-9)45-24(5-27)20(38)13(31)7(2-26)44-24/h6-23,25-38H,1-5H2/t6-,7-,8-,9-,10+,11+,12-,13-,14+,15+,16+,17-,18-,19-,20+,21+,22+,23-,24+/m1/s1','O-alpha-D-galactopyranosyl-(1->6)o-alpha-D-galactopyranosyl-(1->6)O-alpha-D-galactopyranosyl-beta-D-fructofuranoside'),
  ('InChI=1S/C3H7NO2S/c4-2(1-7)3(5)6/h2,7H,1,4H2,(H,5,6)/t2-/m0/s1','Cys'),
  ('InChI=1S/C10H14O/c1-8(2)10-5-3-9(7-11)4-6-10/h3,7,10H,1,4-6H2,2H3','perillylaldehyde'),
  ('InChI=1S/C15H23N5O14P2/c16-12-7-13(18-4-19(12)14-10(23)8(21)5(33-14)1-31-35(25,26)27)20(3-17-7)15-11(24)9(22)6(34-15)2-32-36(28,29)30/h3-6,8-11,14-16,21-24H,1-2H2,(H2,25,26,27)(H2,28,29,30)/t5-,6-,8-,9-,10-,11-,14-,15-/m1/s1','5-phosphoribosyl-AMP'),
  ('InChI=1S/C8H6O4/c9-7(10)5-3-1-2-4-6(5)8(11)12/h1-4H,(H,9,10)(H,11,12)/p-2','1,2-benzenedicarboxylate'),
  ('InChI=1S/C8H12O2/c1-2-6-4-3-5-7(9)8(6)10/h3-5,7-10H,2H2,1H3/t7-,8+/m0/s1','cis-1,2-dihydro-3-ethylcatechol'),
  ('InChI=1S/C6H12N2O3/c1-8-5(9)3-2-4(7)6(10)11/h4H,2-3,7H2,1H3,(H,8,9)(H,10,11)/t4-/m0/s1','N(delta)-methylglutamine'),
  ('InChI=1S/C4H8O2/c1-3(5)4(2)6/h3,5H,1-2H3/t3-/m0/s1','(S)-2-acetoin');
