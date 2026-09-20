import { ImageSourcePropType } from 'react-native';

export interface GuideSection {
  title: string;
  body: string;
}

export interface Guide {
  id: string;
  category: 'Hygiène féminine' | 'Postpartum' | 'Bébé' | 'Bien-être';
  title: string;
  excerpt: string;
  readingTime: number;
  image: ImageSourcePropType;
  sections: GuideSection[];
  tone: 'rose' | 'sage' | 'warm';
}

export const GUIDES: Guide[] = [
  {
    id: 'postpartum-routine',
    category: 'Postpartum',
    title: 'Routine postpartum en douceur',
    excerpt: 'Les premiers gestes pour apaiser, hydrater et retrouver de l’énergie.',
    readingTime: 4,
    image: require('../../assets/images/guides/postpartum.jpg'),
    tone: 'rose',
    sections: [
      {
        title: 'Les 3 premières semaines',
        body: 'Privilégiez les soins sans parfum et les serviettes ultra-absorbantes. Changez toutes les 3 à 4 heures et gardez une pochette prête près du lit pour la nuit.',
      },
      {
        title: 'S’hydrater et récupérer',
        body: 'Une crème riche sur les zones sensibles, une eau thermale en brume et une gourde à portée de main. Programmez un rappel de livraison pour ne jamais être à court.',
      },
      {
        title: 'Demander de l’aide',
        body: 'Notez ce qui vous soulage pour l’expliquer à votre sage-femme. Gardez un espace de soin organisé : un panier, deux produits, zéro charge mentale.',
      },
    ],
  },
  {
    id: 'maternity-bag',
    category: 'Postpartum',
    title: 'Préparer son sac maternité',
    excerpt: 'La checklist essentielle, prête à être cochée avant le grand jour.',
    readingTime: 3,
    image: require('../../assets/images/guides/maternity-bag.jpg'),
    tone: 'warm',
    sections: [
      {
        title: 'Pour vous',
        body: '2 tenues confortables, des serviettes postpartum, une trousse de toilette sans parfum, des chaussons antidérapants et une gourde.',
      },
      {
        title: 'Pour bébé',
        body: '3 bodies, 2 pyjamas, un bonnet, des lingettes douces et une couverture. Prévoyez une taille naissance et une taille 1 mois.',
      },
      {
        title: 'Les oublis fréquents',
        body: 'Chargeur long, écouteurs, baume à lèvres, carnet de notes et une petite collation. Gardez le sac dans le coffre dès la 36e semaine.',
      },
    ],
  },
  {
    id: 'intimate-care',
    category: 'Hygiène féminine',
    title: 'Hygiène intime au quotidien',
    excerpt: 'Des habitudes simples, apaisantes et respectueuses de votre équilibre.',
    readingTime: 4,
    image: require('../../assets/images/guides/intimate-care.jpg'),
    tone: 'sage',
    sections: [
      {
        title: 'Un savon adapté',
        body: 'Un gel lavant à pH physiologique, sans savon ni parfum, une fois par jour suffit. L’eau seule reste recommandée en dehors des règles.',
      },
      {
        title: 'Pendant les règles',
        body: 'Changez toutes les 4 heures maximum, privilégiez le coton bio la nuit et alternez avec une cup si elle vous convient. Une culotte de règles est une bonne option de secours.',
      },
      {
        title: 'Quand consulter',
        body: 'Démangeaisons, odeurs inhabituelles ou douleurs qui persistent plus de 48 heures : parlez-en à un professionnel de santé.',
      },
    ],
  },
  {
    id: 'baby-care',
    category: 'Bébé',
    title: 'Le change, geste par geste',
    excerpt: 'Éviter les rougeurs et garder la peau de bébé confortable, jour et nuit.',
    readingTime: 3,
    image: require('../../assets/images/guides/maternity-bag.jpg'),
    tone: 'rose',
    sections: [
      {
        title: 'À chaque change',
        body: 'Nettoyez de l’avant vers l’arrière, séchez par tapotement et laissez sécher à l’air 2 minutes avant de remettre une couche.',
      },
      {
        title: 'Prévenir les rougeurs',
        body: 'Une pâte protectrice fine sur les zones de frottement, une couche ni trop serrée ni trop petite. Changez aussi la nuit si bébé est gêné.',
      },
      {
        title: 'Penser au stock',
        body: 'Comptez 8 à 10 changes par jour la première année. L’abonnement ajuste la taille au bon moment pour éviter les ruptures.',
      },
    ],
  },
  {
    id: 'wellness-ritual',
    category: 'Bien-être',
    title: '5 minutes pour soi',
    excerpt: 'Un rituel court, réaliste, qui tient même les jours chargés.',
    readingTime: 2,
    image: require('../../assets/images/guides/postpartum.jpg'),
    tone: 'sage',
    sections: [
      {
        title: 'Respirer d’abord',
        body: 'Trois respirations lentes, épaules relâchées, une main sur le ventre. Cela suffit à calmer le système nerveux.',
      },
      {
        title: 'Une tisane, un carnet',
        body: 'Notez une réussite de la journée et une priorité pour demain. Le reste peut attendre.',
      },
      {
        title: 'Bouger en douceur',
        body: 'Une marche de 10 minutes, un étirement du dos, un podcast. La régularité compte plus que l’intensité.',
      },
    ],
  },
];

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}
