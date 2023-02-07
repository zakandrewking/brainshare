/* eslint-disable no-template-curly-in-string */

const displayConfig = {
  topLevelResources: ["chemical", "reaction", "protein", "genome", "species"],
  listProperties: {
    chemical: [
      {
        property: "structure",
        maxWidth: 150,
        height: 85,
        displayName: "",
      },
      "name",
    ],
    reaction: ["name"],
    species: ["name"],
    protein: ["name", "short_name"],
    genome: ["strain_name"],
  },
  detailProperties: {
    chemical: [
      {
        property: "name",
        gridSize: 6,
      },
      {
        property: "structure",
        displayName: "",
        gridSize: 6,
      },
      "inchi",
      "inchi_key",
      "synonym",
      "reaction",
    ],
    reaction: ["name", "stoichiometry", "protein", "synonym", "hash"],
    species: ["name", "rank", "genome", "synonym", "hash"],
    protein: [
      "name",
      "short_name",
      "sequence",
      "reaction",
      "species",
      "synonym",
      "hash",
    ],
    genome: [
      "strain_name",
      {
        property: "genbank_gz_object",
        displayName: "Genbank Download",
      },
      "genome_synonym",
    ],
  },
  propertyDefinitions: {
    structure: {
      type: "svg",
      bucket: "structure_images_svg",
      pathTemplate: "${id}${BRAINSHARE_UNDERSCORE_DARK}.svg",
    },
    genbank_gz_object: {
      type: "download",
      buttonText: "Download Genbank (gzip)",
      bucketKey: "bucket",
    },
    genome_synonym: {
      type: "sourceValue",
      formattingRules: {
        ncbi_taxonomy: {
          valueLink:
            "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${value}",
        },
        refseq_chromosome: {
          valueLink: "https://www.ncbi.nlm.nih.gov/nuccore/${value}",
        },
        refseq_assembly: {
          valueLink: "https://www.ncbi.nlm.nih.gov/data-hub/genome/${value}",
        },
      },
    },
    synonym: {
      type: "sourceValue",
      formattingRules: {
        chebi: {
          valueLink: "https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${value}",
        },
        rhea: {
          valueLink: "https://www.rhea-db.org/rhea/${value}",
        },
        metacyc: {
          valueLink: "https://metacyc.org/gene?orgid=META&id=${value}",
        },
        uniprot: {
          valueLink: "https://www.uniprot.org/uniprotkb/${value}",
        },
        pubmed: {
          valueLink: "https://pubmed.ncbi.nlm.nih.gov/${value}",
        },
        ncbi_taxonomy: {
          valueLink:
            "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${value}",
        },
      },
    },
    notes: {
      type: "markdown",
    },
    stoichiometry: {
      type: "reactionParticipants",
    },
    reaction: {
      type: "internalLink",
      formattingRules: {
        nameKey: "name",
        linkTemplate: "/${type}/${id}",
      },
    },
    species: {
      type: "internalLink",
      formattingRules: {
        nameKey: "name",
        linkTemplate: "/${type}/${id}",
      },
    },
    protein: {
      type: "internalLink",
      formattingRules: {
        nameKey: "name",
        linkTemplate: "/${type}/${id}",
      },
    },
    genome: {
      type: "internalLink",
      formattingRules: {
        nameKey: "strain_name",
        linkTemplate: "/${type}/${id}",
      },
    },
    sequence: {
      type: "aminoAcidSequence",
    },
    name: {
      type: "text",
    },
  },
  joinResources: {
    chemical: "*, synonym(*), reaction(*)",
    reaction: "*, stoichiometry(*, chemical(*)), protein(*), synonym(*)",
    protein: "*, synonym(*), reaction(*), species(*)",
    species: "*, synonym(*), protein(*), genome(*)",
    genome: "*, genome_synonym(*)",
  },
  joinLimits: {
    chemical: { reaction: 8 },
  },
  plural: {
    chemical: "chemicals",
    reaction: "reactions",
    species: "species",
    synonym: "synonyms",
    protein: "proteins",
    genome: "genomes",
  },
  specialCapitalize: {
    inchi: "InChI",
    inchi_key: "InChI Key",
    ncbi_taxonomy: "NCBI Taxonomy",
    uniprot: "UniProt",
    metacyc: "MetaCyc",
    rhea: "RHEA",
    chebi: "ChEBI",
    pubmed: "PubMed",
  },
  icon: {
    chemical: "co2",
    reaction: "syncAlt",
    species: "emojiNature",
    protein: "gesture",
  },
} as const;

export default displayConfig;
