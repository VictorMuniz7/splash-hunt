import { Injectable, signal } from '@angular/core';

export type Locale = 'pt-BR' | 'en';

export type TranslationKey =
  | 'menu.intro'
  | 'menu.startButton'
  | 'menu.startLabel'
  | 'menu.vultoLabel'
  | 'menu.vultoTooltip'
  | 'menu.pbLabel'
  | 'menu.pbLabelLine1'
  | 'menu.pbLabelLine2'
  | 'menu.pbTooltip'
  | 'game.loading'
  | 'game.secondsRemaining'
  | 'game.championPlaceholder'
  | 'game.skinPlaceholderLoading'
  | 'game.skinPlaceholder'
  | 'game.submit'
  | 'game.attemptsTitle'
  | 'game.noAttempts'
  | 'game.imageAlt'
  | 'game.noResults'
  | 'result.win'
  | 'result.lose'
  | 'result.attemptsLabel'
  | 'result.timeLabel'
  | 'result.playAgain'
  | 'mode.vulto'
  | 'mode.pretoEBranco'
  | 'footer.disclaimer'
  | 'language.switchTo';

const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = {
  'pt-BR': {
    'menu.intro':
      'Uma splash art de campeão do League of Legends aparece com zoom em um trecho aleatório da imagem. Descubra o campeão e o visual certos — cada tentativa errada revela um pouco mais.',
    'menu.startButton': 'botão para começar',
    'menu.startLabel': 'iniciar',
    'menu.vultoLabel': 'Vulto',
    'menu.vultoTooltip':
      'A splash some após ~1s. Você tem 15s para acertar — errar ou estourar o tempo encerra a partida.',
    'menu.pbLabel': 'Preto e Branco',
    'menu.pbLabelLine1': 'Preto e',
    'menu.pbLabelLine2': 'Branco',
    'menu.pbTooltip': 'A splash art fica em preto e branco durante toda a tentativa. Some ao acertar.',
    'game.loading': 'Sorteando splash art…',
    'game.secondsRemaining': 'segundos restantes',
    'game.championPlaceholder': 'Buscar campeão…',
    'game.skinPlaceholderLoading': 'Carregando visuais…',
    'game.skinPlaceholder': 'Buscar visual…',
    'game.submit': 'Tentar',
    'game.attemptsTitle': 'Tentativas',
    'game.noAttempts': 'Nenhuma tentativa ainda.',
    'game.imageAlt': 'Splash art misteriosa de um campeão de League of Legends',
    'game.noResults': 'Nenhum resultado',
    'result.win': 'Acertou!',
    'result.lose': 'Vulto escapou…',
    'result.attemptsLabel': 'tentativas',
    'result.timeLabel': 'tempo',
    'result.playAgain': 'Jogar novamente',
    'mode.vulto': 'Vulto',
    'mode.pretoEBranco': 'Preto e Branco',
    'footer.disclaimer':
      'Splash Hunt não é endossado pela Riot Games e não reflete opiniões da Riot Games ou de qualquer pessoa oficialmente envolvida na produção do League of Legends. League of Legends e Riot Games são marcas registradas da Riot Games, Inc.',
    'language.switchTo': 'EN',
  },
  en: {
    'menu.intro':
      "A League of Legends champion splash art shows up zoomed into a random spot of the image. Figure out the right champion and skin — every wrong guess reveals a bit more.",
    'menu.startButton': 'button to start',
    'menu.startLabel': 'start',
    'menu.vultoLabel': 'Shade',
    'menu.vultoTooltip':
      'The splash vanishes after ~1s. You get 15s to answer — a wrong guess or running out of time ends the run.',
    'menu.pbLabel': 'Black & White',
    'menu.pbLabelLine1': 'Black &',
    'menu.pbLabelLine2': 'White',
    'menu.pbTooltip': 'The splash art stays black and white for the whole attempt. Reverts once you win.',
    'game.loading': 'Drawing a splash art…',
    'game.secondsRemaining': 'seconds left',
    'game.championPlaceholder': 'Search champion…',
    'game.skinPlaceholderLoading': 'Loading skins…',
    'game.skinPlaceholder': 'Search skin…',
    'game.submit': 'Guess',
    'game.attemptsTitle': 'Attempts',
    'game.noAttempts': 'No attempts yet.',
    'game.imageAlt': 'Mystery League of Legends champion splash art',
    'game.noResults': 'No results',
    'result.win': 'Nailed it!',
    'result.lose': 'The shade got away…',
    'result.attemptsLabel': 'attempts',
    'result.timeLabel': 'time',
    'result.playAgain': 'Play again',
    'mode.vulto': 'Shade',
    'mode.pretoEBranco': 'Black & White',
    'footer.disclaimer':
      'Splash Hunt is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.',
    'language.switchTo': 'PT-BR',
  },
};

const DDRAGON_LOCALE: Record<Locale, string> = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>('pt-BR');

  toggle(): void {
    this.locale.set(this.locale() === 'pt-BR' ? 'en' : 'pt-BR');
  }

  t(key: TranslationKey): string {
    return TRANSLATIONS[this.locale()][key];
  }

  get ddragonLocale(): string {
    return DDRAGON_LOCALE[this.locale()];
  }
}
