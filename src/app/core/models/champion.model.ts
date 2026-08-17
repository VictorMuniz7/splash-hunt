export interface ChampionImage {
  full: string;
}

export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  image: ChampionImage;
}

export interface Skin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
  parentSkin?: number;
}

export interface ChampionDetail extends ChampionSummary {
  skins: Skin[];
}

export interface SplashOption {
  championId: string;
  championName: string;
  skinNum: number;
  skinLabel: string;
  splashUrl: string;
}
