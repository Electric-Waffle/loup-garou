/* =====================================================================================
 *  casParticuliers.ts — les situations surprenantes, expliquées pour la page Explications
 * =====================================================================================
 *
 *  Chaque cas décrit :
 *    - roles  : les cartes CONCERNÉES (badges et filtre). Au plus 4 cas par carte, pour garder
 *               les gros cas seulement ;
 *    - table  : la situation dessinée (une carte par siège, avec ses tags), qui peut montrer
 *               d'autres cartes que celles de `roles` (un Loup-Garou qui mord, par exemple) ;
 *    - etapes : ce qui se passe, dans l'ordre, et POURQUOI le moteur le fait ainsi.
 *
 *  POURQUOI des données et pas du JSX : la page n'a qu'une façon d'afficher un cas. Ajouter un
 *  cas, c'est ajouter un objet ici, sans toucher à l'affichage.
 *  ATTENTION : ces textes décrivent les règles du moteur. Si une règle change, le cas aussi.
 * ===================================================================================== */

export interface SiegeDuCas {
  role: string;     // alias de la carte
  tags?: string[];  // tags affichés sous le siège (clés de TAGS)
}

export interface EtapeDuCas {
  quoi: string;     // ce qui se passe
  pourquoi: string; // pourquoi le moteur le fait ainsi
}

export interface CasParticulier {
  titre: string;
  contexte: string;
  roles: string[];
  table: SiegeDuCas[];
  etapes: EtapeDuCas[];
}

export const CAS_PARTICULIERS: CasParticulier[] = [
  {
    titre: "L'Ancien amoureux du Chasseur",
    contexte: "Les loups mordent l'Ancien et la Sorcière empoisonne le Chasseur, son amoureux, la même nuit.",
    roles: ["ancien", "chasseur", "sorciere", "cupidon"],
    table: [
      { role: "ancien", tags: ["mordu", "amoureux"] },
      { role: "chasseur", tags: ["empoisonne", "amoureux"] },
      { role: "sorciere" },
      { role: "loup" },
      { role: "cupidon" }
    ],
    etapes: [
      { quoi: "À l'aube, la morsure de l'Ancien est traitée en premier : il perd une vie mais survit.", pourquoi: "L'aube applique les morsures avant les poisons, et la première morsure de l'Ancien devient « vie perdue »." },
      { quoi: "Puis le poison tue le Chasseur.", pourquoi: "Le poison n'est pas une morsure : rien ne le bloque." },
      { quoi: "L'Ancien meurt aussitôt de chagrin.", pourquoi: "Sa seconde vie ne protège que des loups ; le chagrin est une autre cause de mort." },
      { quoi: "Le Chasseur tire quand même sur le joueur de son choix.", pourquoi: "Sa mort a lieu normalement, puis il réagit : le chagrin de son amoureux ne l'en empêche pas." }
    ]
  },
  {
    titre: "L'Ancien éliminé par le village",
    contexte: "Le village vote contre l'Ancien, en croyant qu'il est un loup.",
    roles: ["ancien", "fou"],
    table: [
      { role: "ancien", tags: ["mort"] },
      { role: "voyante", tags: ["impuissant"] },
      { role: "sorciere", tags: ["impuissant"] },
      { role: "fou", tags: ["impuissant"] },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "L'Ancien meurt, et tous les vivants qui ne sont pas du camp des loups perdent leur pouvoir.", pourquoi: "Sa mort par le vote donne « sans pouvoir » à chacun d'eux, pour toute la partie." },
      { quoi: "La Voyante et la Sorcière ne font plus rien : leur carte n'offre que « Passer ».", pourquoi: "« Sans pouvoir » est un tag bloquant, comme l'enchantement de la Fée, mais il n'expire jamais." },
      { quoi: "Le Fou perd aussi ses pouvoirs, mais les loups gardent les leurs.", pourquoi: "Le Fou n'est pas du camp des loups : seule la meute est épargnée." },
      { quoi: "Une carte devenue loup avant ce vote (Prêtre impur, Faux Parleur) garde ses pouvoirs.", pourquoi: "La règle regarde le camp au moment du vote." }
    ]
  },
  {
    titre: "Le Salvateur devant la Sorcière",
    contexte: "Les loups mordent le joueur que le Salvateur a protégé.",
    roles: ["salvateur", "sorciere"],
    table: [
      { role: "villageois", tags: ["protege"] },
      { role: "salvateur" },
      { role: "sorciere" },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "La morsure est bloquée : le joueur protégé n'est pas mordu.", pourquoi: "C'est la règle de la morsure qui regarde si le receveur est protégé ; les loups n'en savent rien." },
      { quoi: "La Sorcière ne voit aucune victime, et sa potion de vie n'est pas proposée.", pourquoi: "Elle ne voit que les joueurs qui portent la morsure, et il n'y en a pas." },
      { quoi: "La nuit suivante, le Salvateur ne peut pas protéger le même joueur.", pourquoi: "À l'aube, la protection devient « protégé hier », qui refuse une nouvelle protection." }
    ]
  },
  {
    titre: "Le Rat qui mord",
    contexte: "Les loups dévorent le Rat. Il choisit de mordre un loup.",
    roles: ["rat", "sorciere"],
    table: [
      { role: "rat", tags: ["agonisant"] },
      { role: "loup", tags: ["peste"] },
      { role: "loup" },
      { role: "sorciere" }
    ],
    etapes: [
      { quoi: "Juste après le tour des loups, le Rat choisit en silence : il mord.", pourquoi: "Sa morsure ouvre une décision urgente, jouée avant la Sorcière." },
      { quoi: "Il devient agonisant : il mourra à l'aube, et la Sorcière ne le voit pas.", pourquoi: "« Agonisant » remplace la morsure : sans morsure, la potion de vie n'a rien à soigner." },
      { quoi: "Un des loups attrape la peste, tiré au hasard. Il mourra à la 4e aube.", pourquoi: "La peste avance d'un cran à chaque aube : 3 nuits de sursis." },
      { quoi: "Personne n'est prévenu : ni les loups, ni le village.", pourquoi: "Le choix du Rat doit rester secret ; ils le comprendront au fil des aubes." }
    ]
  },
  {
    titre: "Le Rat qui rejoint la meute",
    contexte: "Les loups dévorent le Rat. Il choisit de devenir l'un des leurs.",
    roles: ["rat", "rat-garou"],
    table: [
      { role: "rat-garou" },
      { role: "loup" },
      { role: "sorciere" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "La morsure est d'abord annulée.", pourquoi: "Sans ça, le nouveau Rat-garou mourrait à l'aube de la morsure qu'il vient de survivre." },
      { quoi: "Puis sa carte devient Rat-garou : il compte désormais comme un loup.", pourquoi: "Le tag « devient » change la carte du joueur ; ses autres tags et sa mémoire sont gardés." },
      { quoi: "La Sorcière ne voit aucune victime.", pourquoi: "Il n'y a plus de morsure à soigner." },
      { quoi: "Le matin, les loups voient qu'il est vivant et comprennent son choix.", pourquoi: "C'est le seul indice prévu par la carte." }
    ]
  },
  {
    titre: "Le Rat-garou, dernier de la meute",
    contexte: "Le dernier vrai loup meurt. Il ne reste que le Rat-garou dans le camp des loups.",
    roles: ["rat-garou"],
    table: [
      { role: "rat-garou" },
      { role: "loup", tags: ["mort"] },
      { role: "villageois" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Face à plusieurs joueurs, il meurt à l'aube suivante.", pourquoi: "Sa carte vérifie à chaque aube s'il est le dernier vivant du camp des loups." },
      { quoi: "Face à un seul joueur, le village gagne tout de suite.", pourquoi: "Sinon « 1 loup contre 1 » ferait gagner les loups avant que l'aube ne le tue : la victoire le traite à part." }
    ]
  },
  {
    titre: "Le Rat éliminé contamine le maire",
    contexte: "Le village élimine le Rat (ou le Rat-garou) par le vote.",
    roles: ["rat", "rat-garou"],
    table: [
      { role: "rat", tags: ["mort"] },
      { role: "villageois", tags: ["maire", "peste"] },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Le maire attrape la peste : il mourra à la 4e aube.", pourquoi: "Les deux cartes réagissent à leur mort par le vote en contaminant le maire vivant." },
      { quoi: "Si le Rat était lui-même le maire, rien ne se passe.", pourquoi: "Il est déjà mort : il n'y a plus de maire vivant à contaminer." }
    ]
  },
  {
    titre: "Le Fou vole la victoire des loups",
    contexte: "Les loups deviennent aussi nombreux que les autres, alors que le Fou est encore en vie.",
    roles: ["fou", "loup", "pretre-impur", "faux-parleur"],
    table: [
      { role: "fou" },
      { role: "loup" },
      { role: "pretre-impur" },
      { role: "villageois" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Le Fou gagne, seul.", pourquoi: "Il voulait la victoire des loups : s'il est vivant à ce moment, elle lui revient." },
      { quoi: "Les loups perdent, et le Prêtre impur ou le Faux Parleur aussi.", pourquoi: "Ils sont du camp des loups : ils gagnent et perdent avec eux." },
      { quoi: "Le Fou ne compte pas dans le nombre de loups.", pourquoi: "Son camp est « fou » : pour atteindre l'égalité, il faut des loups en plus de lui." }
    ]
  },
  {
    titre: "Le Skinwalker vole la victoire du village",
    contexte: "Le dernier loup meurt alors que le Skinwalker est encore en vie.",
    roles: ["skinwalker", "villageois"],
    table: [
      { role: "skinwalker" },
      { role: "loup", tags: ["mort"] },
      { role: "villageois" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Le Skinwalker gagne, seul : le village perd.", pourquoi: "Il se cachait parmi les villageois : leur victoire lui revient s'il est vivant." },
      { quoi: "Il en va de même si toutes les maisons sont renforcées par le Bâtisseur.", pourquoi: "C'est aussi une victoire du village." },
      { quoi: "Le village doit donc l'éliminer avant le dernier loup.", pourquoi: "Il ne compte pas comme un loup : sa présence ne retarde pas la victoire, elle la vole." }
    ]
  },
  {
    titre: "Le Skinwalker prend la carte de la Sorcière",
    contexte: "Nuit 3, le Skinwalker tue la Sorcière. Plus tard, la Voyante le regarde.",
    roles: ["skinwalker", "sorciere", "voyante"],
    table: [
      { role: "skinwalker", tags: ["imite"] },
      { role: "sorciere", tags: ["mort"] },
      { role: "voyante" },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "La Sorcière meurt, et sa carte n'est pas révélée au rapport de l'aube.", pourquoi: "Sa mort a la cause « skinwalker », que le rapport sait cacher." },
      { quoi: "Le Skinwalker joue désormais la Sorcière, avec ses deux potions neuves.", pourquoi: "Il prend la carte, pas la mémoire de la victime : la carte repart à neuf." },
      { quoi: "Il la joue dès cette nuit-là.", pourquoi: "La Sorcière (rang 130) joue après lui (rang 126)." },
      { quoi: "La Voyante qui le regarde voit « Sorcière ».", pourquoi: "Les voyantes voient la carte qu'il imite, pas sa vraie carte." }
    ]
  },
  {
    titre: "Le Skinwalker contre le Salvateur",
    contexte: "Le Skinwalker vise le joueur protégé par le Salvateur.",
    roles: ["skinwalker", "salvateur"],
    table: [
      { role: "skinwalker" },
      { role: "villageois", tags: ["protege"] },
      { role: "salvateur" },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Le meurtre échoue : la victime survit, et il ne prend pas sa carte.", pourquoi: "Son meurtre est inconditionnel, sauf contre la protection du Salvateur." },
      { quoi: "La nuit suivante, il ne peut tuer personne.", pourquoi: "Son échec le force à se cacher une nuit : sa carte n'offre alors aucun choix." },
      { quoi: "Il joue après le Salvateur.", pourquoi: "Rang 126 contre 100 : la protection existe déjà quand il frappe." }
    ]
  },
  {
    titre: "La Voyante regarde l'Aberration",
    contexte: "La Voyante, ou le Loup voyante, choisit de voir la carte de l'Aberration.",
    roles: ["aberration", "voyante", "loup-voyante"],
    table: [
      { role: "aberration", tags: ["protege"] },
      { role: "voyante", tags: ["catatonique"] },
      { role: "loup-voyante" },
      { role: "salvateur" }
    ],
    etapes: [
      { quoi: "La Voyante n'apprend rien : elle devient catatonique et meurt à l'aube.", pourquoi: "Voir l'Aberration rend fou ; « catatonique » bloque son rôle puis la tue à l'aube, cause « horreur »." },
      { quoi: "Si l'Aberration est protégée, le Loup voyante, lui, ne risque rien.", pourquoi: "Sa vision échoue sur une cible protégée avant de voir la carte." },
      { quoi: "La Voyante du village n'a pas cette chance.", pourquoi: "La protection du Salvateur ne fait pas échouer sa vision." }
    ]
  },
  {
    titre: "L'Aberration horrifie tout le monde",
    contexte: "Nuit après nuit, l'Aberration horrifie les joueurs, loups comme villageois.",
    roles: ["aberration", "loup", "villageois"],
    table: [
      { role: "aberration" },
      { role: "loup", tags: ["horrifie"] },
      { role: "villageois", tags: ["horrifie"] },
      { role: "villageois", tags: ["horrifie"] }
    ],
    etapes: [
      { quoi: "Quand tous ceux qui chassent avec la meute sont horrifiés, les loups ne mangent plus.", pourquoi: "La carte des loups ne propose plus de victime." },
      { quoi: "Quand tous les villageois vivants sont horrifiés, le village ne peut plus voter.", pourquoi: "L'écran du vote n'accepte plus que « Personne n'est éliminé »." },
      { quoi: "Tant qu'elle vit, personne d'autre ne gagne ; tous les autres horrifiés, elle gagne.", pourquoi: "La victoire de l'Aberration est vérifiée avant toutes les autres." },
      { quoi: "Si elle meurt, l'horreur disparaît chez tout le monde.", pourquoi: "À sa mort, elle retire « horrifié » à chaque joueur : loups et village reprennent." }
    ]
  },
  {
    titre: "Le Loup vampire amoureux",
    contexte: "Cupidon lie le Loup vampire à un villageois.",
    roles: ["loup-vampire", "cupidon"],
    table: [
      { role: "loup-vampire", tags: ["invulnerable", "amoureux"] },
      { role: "villageois", tags: ["amoureux"] },
      { role: "cupidon" },
      { role: "sorciere" }
    ],
    etapes: [
      { quoi: "Si son amoureux meurt, le Loup vampire survit.", pourquoi: "Il est invulnérable : seule une mort par le vote du village le touche, et le chagrin n'en est pas une." },
      { quoi: "S'il est voté, son amoureux meurt de chagrin.", pourquoi: "Sa mort par le vote a lieu normalement, et le chagrin suit." },
      { quoi: "Le poison de la Sorcière ne le tue pas non plus.", pourquoi: "Même règle : seul le vote passe." }
    ]
  },
  {
    titre: "L'or du Marchand passe aux loups",
    contexte: "Les loups dévorent le Marchand. Plus tard, le village vote contre le loup qui a hérité de l'or.",
    roles: ["marchand", "loup-vampire"],
    table: [
      { role: "marchand", tags: ["mort"] },
      { role: "loup-vampire", tags: ["or"] },
      { role: "loup" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "L'or passe à un des loups vivants, tiré au hasard.", pourquoi: "L'or va à un des tueurs : ici, ceux qui chassent avec la meute." },
      { quoi: "Voté, ce loup dépense l'or : le vote est annulé, il a seul la parole, puis le village revote.", pourquoi: "La règle de l'or vaut pour tout porteur, pas seulement pour le Marchand." },
      { quoi: "Un Loup vampire peut ainsi racheter le seul vote qui pouvait le tuer.", pourquoi: "L'or est vérifié avant la mort par le vote." }
    ]
  },
  {
    titre: "Le Conquistador tire sur l'or",
    contexte: "Le Conquistador tire sa balle sur le Marchand, qui a encore son or.",
    roles: ["conquistador", "marchand"],
    table: [
      { role: "conquistador", tags: ["or"] },
      { role: "marchand", tags: ["mort"] },
      { role: "loup" },
      { role: "salvateur" }
    ],
    etapes: [
      { quoi: "Le Marchand meurt, même protégé par le Salvateur.", pourquoi: "Une balle n'est pas une morsure : la protection ne bloque que les morsures." },
      { quoi: "Le Conquistador récupère sa balle : il pourra tirer une autre nuit.", pourquoi: "Sa carte regarde, avant le tir, si la victime porte de l'or." },
      { quoi: "Il hérite aussi de l'or, et pourra racheter son propre vote.", pourquoi: "L'or d'un mort passe à son tueur vivant : ici, le Conquistador." }
    ]
  },
  {
    titre: "Le Loup salamandre et l'Ultimatum",
    contexte: "Jour d'Ultimatum. Le village vote contre un joueur ignifuge qui a de l'or.",
    roles: ["loup-salamandre", "marchand"],
    table: [
      { role: "marchand", tags: ["ignifuge", "or"] },
      { role: "loup-salamandre" },
      { role: "villageois", tags: ["maire"] },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Premier vote : il paie avec son or, plaide seul, et le village revote.", pourquoi: "L'or passe avant la salamandre : il rachète d'abord le vote." },
      { quoi: "Vote final : il entre dans les flammes et en ressort indemne.", pourquoi: "La mort par le vote d'un joueur ignifuge est bloquée, et le village l'apprend." },
      { quoi: "Le maire meurt de l'Ultimatum.", pourquoi: "Un vote bloqué compte comme « personne n'est éliminé » : aucun loup n'est tombé." }
    ]
  },
  {
    titre: "Le Paysan dévoré blesse la meute",
    contexte: "Les loups dévorent le Paysan. Le Loup barbare attend son heure.",
    roles: ["paysan", "loup", "loup-barbare"],
    table: [
      { role: "paysan", tags: ["mort"] },
      { role: "loup", tags: ["blesse"] },
      { role: "loup", tags: ["blesse"] },
      { role: "loup-barbare" }
    ],
    etapes: [
      { quoi: "Tous ceux qui chassent avec la meute sont blessés : la nuit suivante, les loups ne mangent personne.", pourquoi: "La carte des loups ne propose aucune victime si tous ses membres sont blessés." },
      { quoi: "La blessure dure jusqu'à l'aube d'après.", pourquoi: "La mort arrive pendant l'aube : une blessure qui expirait à cette aube disparaîtrait aussitôt." },
      { quoi: "Le Loup barbare n'est pas blessé, et peut encore mordre si son heure vient.", pourquoi: "Il ne chasse pas avec la meute : la blessure ne le touche pas." }
    ]
  },
  {
    titre: "La Fée enchante le Chasseur ou le Rat",
    contexte: "La Fée enchante le Chasseur, et les loups le dévorent. Ou elle enchante le Rat, et les loups le mordent.",
    roles: ["fee", "chasseur", "rat"],
    table: [
      { role: "fee" },
      { role: "chasseur", tags: ["enchante", "mordu"] },
      { role: "rat", tags: ["enchante", "mordu"] },
      { role: "sorciere" }
    ],
    etapes: [
      { quoi: "Le Chasseur meurt à l'aube sans tirer.", pourquoi: "L'enchantement dure jusqu'à la toute fin de l'aube : il est encore enchanté quand il meurt." },
      { quoi: "Le Rat mordu ne choisit rien.", pourquoi: "Un joueur enchanté n'a aucune décision urgente." },
      { quoi: "La Sorcière peut donc sauver le Rat.", pourquoi: "Il porte toujours la morsure, sans être agonisant." }
    ]
  },
  {
    titre: "L'Arlequin lie deux joueurs",
    contexte: "L'Arlequin lie la Voyante au Salvateur pour la nuit.",
    roles: ["arlequin"],
    table: [
      { role: "arlequin" },
      { role: "voyante", tags: ["lie"] },
      { role: "salvateur", tags: ["lie"] },
      { role: "loup" },
      { role: "chasseur" }
    ],
    etapes: [
      { quoi: "La Voyante ne peut regarder que le Salvateur ; le Salvateur ne peut protéger qu'elle ou lui-même.", pourquoi: "Un joueur lié qui joue seul sa carte ne voit que lui-même et son partenaire comme cibles." },
      { quoi: "Pour les loups, le meneur décide de tête.", pourquoi: "Une carte de groupe n'appartient pas à un seul joueur lié." },
      { quoi: "Un Chasseur lié et tué cette nuit tire librement.", pourquoi: "Le lien disparaît à la fin de l'aube, avant son tir." }
    ]
  },
  {
    titre: "Le Conciliabule démasque la Pleureuse",
    contexte: "Plusieurs joueurs sont maudits. Pendant le Conciliabule, ils désignent la Pleureuse.",
    roles: ["pleureuse"],
    table: [
      { role: "pleureuse" },
      { role: "voyante", tags: ["maudit"] },
      { role: "chasseur", tags: ["maudit"] },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Tous les maudits sont délivrés : ils retrouvent leur rôle.", pourquoi: "Désigner la Pleureuse lève la malédiction de chacun." },
      { quoi: "La Pleureuse perd son pouvoir.", pourquoi: "Elle est démasquée : sa carte n'offre plus que « Passer »." },
      { quoi: "Le Conciliabule a lieu même après sa mort, et peut la désigner morte.", pourquoi: "Les maudits peuvent désigner n'importe qui, mort ou vivant." },
      { quoi: "À sa mort, le meneur annonce « une villageoise ».", pourquoi: "Sa carte ne doit pas être reconnue par ceux qu'elle a maudits." }
    ]
  },
  {
    titre: "Le réseau d'amoureux",
    contexte: "Cupidon lie A et B. Le Loup amoureux se lie aussi à A. Le Loup succube a B pour compagnon.",
    roles: ["cupidon", "loup-amoureux", "loup-succube"],
    table: [
      { role: "villageois", tags: ["amoureux"] },
      { role: "villageois", tags: ["amoureux"] },
      { role: "loup-amoureux", tags: ["amoureux"] },
      { role: "loup-succube", tags: ["amoureux"] },
      { role: "cupidon" }
    ],
    etapes: [
      { quoi: "A a deux amoureux : B et le Loup amoureux. Si A meurt, les deux meurent de chagrin.", pourquoi: "Les liens s'additionnent : chaque nouveau partenaire s'ajoute aux autres." },
      { quoi: "La mort se propage de proche en proche : la mort de B emporte A, qui emporte le Loup amoureux.", pourquoi: "Le chagrin d'un mourant tue tous ses partenaires, qui à leur tour tuent les leurs." },
      { quoi: "Si B meurt, le Succube survit. Si le Succube meurt, B meurt.", pourquoi: "Le lien du Succube est à sens unique : il est dans les partenaires de B, pas l'inverse." }
    ]
  },
  {
    titre: "Le Salvateur bloque les loups solitaires",
    contexte: "Le Loup amoureux, le Loup succube, le Loup hypnotiseur ou le Loup voyante visent le joueur protégé.",
    roles: ["salvateur", "loup-amoureux", "loup-succube", "loup-hypnotiseur"],
    table: [
      { role: "villageois", tags: ["protege"] },
      { role: "salvateur" },
      { role: "loup-amoureux" },
      { role: "loup-succube" },
      { role: "loup-hypnotiseur" },
      { role: "loup-voyante" }
    ],
    etapes: [
      { quoi: "Loup amoureux : le lien échoue, sans seconde chance.", pourquoi: "Il ne joue que la nuit 1, et après le Salvateur (102 contre 100)." },
      { quoi: "Loup succube : le lien échoue, il réessaiera la nuit suivante.", pourquoi: "Sa carte propose un lien chaque nuit où il n'a pas de compagnon vivant." },
      { quoi: "Loup hypnotiseur : rien ne se passe, mais le médaillon est perdu.", pourquoi: "Le médaillon est détruit dès qu'il est utilisé, que l'effet réussisse ou non." },
      { quoi: "Loup voyante : « la carte reste cachée » ; il apprend donc que ce joueur est protégé.", pourquoi: "La vision échoue avant de voir la carte, et il en est informé." }
    ]
  },
  {
    titre: "Le Loup-démon brûlé par le village",
    contexte: "Le village élimine le Loup-démon par le vote.",
    roles: ["loup-demon", "villageois"],
    table: [
      { role: "loup-demon", tags: ["mort"] },
      { role: "loup", tags: ["possede", "amoureux"] },
      { role: "villageois" },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Un joueur vivant du camp du village, tiré au hasard, est possédé : il devient Loup-Garou.", pourquoi: "Sa mort par le vote lui donne « possédé » puis change sa carte en Loup-Garou." },
      { quoi: "Le possédé garde ses liens : amoureux, or…", pourquoi: "Changer de carte ne retire ni les tags ni la mémoire du joueur." },
      { quoi: "Tué autrement (morsure, poison, chagrin), le Loup-démon meurt sans posséder personne.", pourquoi: "Seule la mort par le vote déclenche la possession." }
    ]
  },
  {
    titre: "Le Loup barbare après une erreur du village",
    contexte: "Le village élimine un innocent. Le lendemain, il élimine personne.",
    roles: ["loup-barbare"],
    table: [
      { role: "loup-barbare" },
      { role: "villageois", tags: ["mort"] },
      { role: "loup" },
      { role: "sorciere" }
    ],
    etapes: [
      { quoi: "La nuit suivante, le Loup barbare mord une victime, après la meute.", pourquoi: "Il retient le numéro de la nuit qui suit l'élimination d'un non-loup." },
      { quoi: "La Sorcière peut soigner sa victime.", pourquoi: "Il joue au rang 124, avant elle (130), et donne une morsure comme les loups." },
      { quoi: "Si le village n'élimine personne, il ne mord pas la nuit suivante.", pourquoi: "Personne d'éliminé n'est pas une erreur du village." },
      { quoi: "Les autres loups ignorent qu'il est des leurs, mais il compte comme un loup pour la victoire.", pourquoi: "Il ne se réveille pas avec la meute, mais son camp est celui des loups." }
    ]
  },
  {
    titre: "Le Beau Parleur maire",
    contexte: "Le Beau Parleur (ou le Faux Parleur) est maire, et le village vote contre un joueur.",
    roles: ["beau-parleur", "faux-parleur", "ancien"],
    table: [
      { role: "beau-parleur", tags: ["maire"] },
      { role: "loup" },
      { role: "villageois" },
      { role: "ancien" }
    ],
    etapes: [
      { quoi: "Avant la mort, le meneur lui montre en secret la carte de l'accusé.", pourquoi: "Son pouvoir suspend chaque vote tant qu'il est maire." },
      { quoi: "Il laisse la mort se produire, ou relance le vote, une seule fois par partie.", pourquoi: "Sa mémoire retient que la relance est utilisée, même s'il devient Faux Parleur." },
      { quoi: "Après l'élimination de l'Ancien par le vote, le vote tue tout de suite.", pourquoi: "Privé de pouvoir, il n'est plus consulté : rien ne suspend le vote." }
    ]
  },
  {
    titre: "Le Prêtre devient impur",
    contexte: "La première nuit, le Prêtre pur choisit l'impureté.",
    roles: ["pretre", "pretre-impur"],
    table: [
      { role: "pretre-impur" },
      { role: "loup" },
      { role: "villageois" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Sa carte devient Prêtre impur, du camp des loups.", pourquoi: "Le choix « impur » lui donne le tag « devient »." },
      { quoi: "Les loups ne le savent pas : il ne se réveille pas avec eux.", pourquoi: "Le Prêtre impur ne rejoint pas la carte des loups." },
      { quoi: "Il compte comme un loup : le village doit l'éliminer aussi pour gagner.", pourquoi: "La victoire compte les camps, et le sien est celui des loups." },
      { quoi: "Mort, il peut encore chuchoter au maire pour le tromper.", pourquoi: "Comme le Prêtre pur, il garde les yeux ouverts le jour après sa mort." }
    ]
  },
  {
    titre: "Le chantier du Bâtisseur",
    contexte: "Le Bâtisseur renforce les maisons. Un Rat devient Rat-garou en cours de partie.",
    roles: ["batisseur"],
    table: [
      { role: "batisseur", tags: ["renforce"] },
      { role: "villageois", tags: ["renforce"] },
      { role: "rat-garou", tags: ["renforce"] },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "Le Rat-garou sort du compte : sa maison renforcée ne sert plus.", pourquoi: "Seules les maisons des villageois VIVANTS comptent, et le camp est relu à chaque vérification." },
      { quoi: "Quand toutes les maisons des villageois vivants sont renforcées, le village gagne, même s'il reste des loups.", pourquoi: "C'est une condition de victoire à part entière." },
      { quoi: "Si les loups atteignent l'égalité au même moment, le Bâtisseur l'emporte.", pourquoi: "Sa victoire est vérifiée avant celle des loups." }
    ]
  },
  {
    titre: "Le Fêtard fait la fête",
    contexte: "Le village élimine un loup, et le Fêtard avait voté contre lui.",
    roles: ["fetard", "salvateur"],
    table: [
      { role: "fetard", tags: ["fete", "protege_hier"] },
      { role: "loup", tags: ["mort"] },
      { role: "loup" },
      { role: "salvateur" }
    ],
    etapes: [
      { quoi: "Le meneur indique qu'il a voté contre le loup : il fait la fête jusqu'à l'aube.", pourquoi: "Le moteur ne sait pas qui a voté pour qui : seul le meneur l'a vu." },
      { quoi: "Les loups qui le mordent cette nuit échouent, sans savoir pourquoi.", pourquoi: "Sa carte bloque la morsure tant qu'il fait la fête." },
      { quoi: "Même protégé par le Salvateur la veille, il fait la fête.", pourquoi: "La fête n'est pas une protection : la règle « pas deux nuits de suite » ne la concerne pas." }
    ]
  },
  {
    titre: "Le Hurleur sous le Clair de lune",
    contexte: "Le maire éclaire le Hurleur avec le Clair de lune. La nuit, la Voyante le sonde.",
    roles: ["hurleur", "voyante"],
    table: [
      { role: "hurleur", tags: ["eclaire"] },
      { role: "voyante" },
      { role: "loup" },
      { role: "villageois", tags: ["maire"] }
    ],
    etapes: [
      { quoi: "La Voyante voit sa carte : Hurleur.", pourquoi: "Le Clair de lune impose sa cible : elle ne peut voir que lui." },
      { quoi: "Il hurle : au rapport de l'aube, le meneur annonce que le Hurleur a été visé par la Voyante.", pourquoi: "Toute carte qui le désigne la nuit le fait hurler, même sans lui donner de tag." },
      { quoi: "Son nom n'est jamais annoncé, même si tout le monde sait qui était éclairé.", pourquoi: "Le Hurleur retire son nom de l'annonce : c'est au village de faire le lien." }
    ]
  },
  {
    titre: "Le Stratège sans réponse",
    contexte: "Le village vote, mais le Stratège n'a plus de pouvoir, ou personne n'est éliminé.",
    roles: ["stratege", "ancien"],
    table: [
      { role: "stratege", tags: ["impuissant"] },
      { role: "ancien", tags: ["mort"] },
      { role: "loup" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Même si personne n'est éliminé, le meneur répond à sa question après le vote.", pourquoi: "Des votes ont eu lieu : savoir si un loup a voté comme lui reste utile." },
      { quoi: "Privé de pouvoir (ici par l'Ancien éliminé), il n'est pas questionné.", pourquoi: "Un joueur bloqué n'a aucune décision urgente." },
      { quoi: "La nuit suivante, il n'apprend rien, pas même la réponse de la veille.", pourquoi: "La réponse est rangée avec le numéro de la nuit où elle sert : elle ne correspond plus." }
    ]
  },
  {
    titre: "Le Sourcier perd son testé",
    contexte: "Le Sourcier teste un joueur, qui est éliminé par le village avant la réponse.",
    roles: ["sourcier", "skinwalker"],
    table: [
      { role: "sourcier" },
      { role: "villageois", tags: ["mort"] },
      { role: "skinwalker" },
      { role: "loup" }
    ],
    etapes: [
      { quoi: "La nuit suivante, il n'apprend rien.", pourquoi: "La réponse n'est donnée que si le testé est encore vivant." },
      { quoi: "Les morts ne comptent pas dans la distance.", pourquoi: "La table est le cercle des vivants : la mort rapproche les survivants." },
      { quoi: "Un Skinwalker déguisé compte comme non-villageois.", pourquoi: "Le Sourcier lit le vrai camp, pas la carte imitée." }
    ]
  },
  {
    titre: "Le Loup savant et la Voyante",
    contexte: "La Voyante sonde une des cartes que le Loup savant a vues.",
    roles: ["loup-savant", "voyante"],
    table: [
      { role: "loup-savant" },
      { role: "voyante" },
      { role: "loup" },
      { role: "villageois" }
    ],
    etapes: [
      { quoi: "Elle apprend que cette carte n'a été distribuée à personne.", pourquoi: "Les 3 cartes hors jeu sont tirées au lancement de la partie, pour tout le monde." },
      { quoi: "Elle sait alors que quiconque prétend avoir cette carte ment : c'est peut-être le Loup savant qui bluffe.", pourquoi: "Ils connaissent tous deux les mêmes cartes hors jeu." }
    ]
  },
  {
    titre: "Les amoureux gagnent ensemble",
    contexte: "Un loup et un villageois sont amoureux, et la partie se resserre.",
    roles: ["cupidon", "loup"],
    table: [
      { role: "loup", tags: ["amoureux"] },
      { role: "villageois", tags: ["amoureux"] },
      { role: "cupidon" }
    ],
    etapes: [
      { quoi: "À 2 amoureux contre 1, les amoureux gagnent, quel que soit leur camp.", pourquoi: "Ils sont strictement plus nombreux que les autres vivants." },
      { quoi: "À 2 contre 2, ils ne gagnent pas encore.", pourquoi: "Avec une simple égalité, des amoureux gagneraient dès la première aube d'une partie à 4." },
      { quoi: "Leur victoire passe avant celle des loups et du village.", pourquoi: "Elle est vérifiée juste après celle de l'Aberration." }
    ]
  },
  {
    titre: "Le Loup hypnotiseur au jour de plaidoirie",
    contexte: "L'hypnotiseur réduit au silence un joueur, et le Marchand rachète son vote avec l'or.",
    roles: ["loup-hypnotiseur", "marchand"],
    table: [
      { role: "loup-hypnotiseur" },
      { role: "villageois", tags: ["silence"] },
      { role: "marchand", tags: ["or"] },
      { role: "villageois", tags: ["dirige"] }
    ],
    etapes: [
      { quoi: "Le vote du joueur silencé ne compte pas, au premier vote comme au second.", pourquoi: "Le silence dure jusqu'à l'aube suivante : il couvre tous les votes du jour." },
      { quoi: "Le joueur dirigé vote comme l'hypnotiseur, sauf si celui-ci est mort.", pourquoi: "Sans hypnotiseur vivant, il n'y a plus personne à suivre." },
      { quoi: "Rien n'est révélé pendant le débat : le meneur le voit seulement à l'écran du vote.", pourquoi: "Le rappel est affiché au vote, jamais avant." }
    ]
  }
];
