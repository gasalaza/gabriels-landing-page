export interface SiteInfo {
  name: string;
  role: string;
  tagline: string;
  location: string;
  email: string;
  linkedin: string;
  available: string;
  about: string;
  stats: Stat[];
}

export interface Stat {
  n: string;
  l: string;
}

export interface Skills {
  [category: string]: string[];
}

export interface StackGroup {
  title: string;
  items: string[];
}

export interface Service {
  badge: string;
  title: string;
  desc: string;
  points: string[];
}

export interface SecurityBullet {
  lead: string;
  text: string;
}

export interface SecurityPosture {
  intro: string;
  bullets: SecurityBullet[];
  linkLine: string;
  linkText: string;
  linkHref: string;
  chips: string[];
  disclosure: string;
}
