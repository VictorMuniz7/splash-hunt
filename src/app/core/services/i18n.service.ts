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
  | 'language.switchTo'
  | 'flag.multiplayer'
  | 'flag.solo'
  | 'profile.playingAs'
  | 'profile.noSessionPrompt'
  | 'profile.changePhoto'
  | 'profile.signOut'
  | 'profile.mode.padrao'
  | 'profile.mode.vulto'
  | 'profile.mode.pretoEBranco'
  | 'profile.mode.anomaly'
  | 'mp.subtitle'
  | 'mp.description'
  | 'mp.nicknamePlaceholder'
  | 'mp.confirm'
  | 'mp.greeting'
  | 'mp.play'
  | 'mp.errorNicknameTaken'
  | 'auth.genericError'
  | 'auth.backToMultiplayer'
  | 'auth.errorAnonymousDisabled'
  | 'rooms.comingSoon'
  | 'rooms.createTitle'
  | 'rooms.chooseMode'
  | 'rooms.createButton'
  | 'rooms.joinTitle'
  | 'rooms.codePlaceholder'
  | 'rooms.joinButton'
  | 'rooms.lobbyCodeLabel'
  | 'rooms.copyCode'
  | 'rooms.copied'
  | 'rooms.waitingOpponent'
  | 'rooms.startMatch'
  | 'rooms.cancelRoom'
  | 'rooms.leaveRoom'
  | 'rooms.hostLabel'
  | 'rooms.guestLabel'
  | 'rooms.cancelledByHost'
  | 'rooms.matchStub'
  | 'rooms.errorNotFound'
  | 'rooms.errorNotJoinable'
  | 'rooms.errorOwnRoom'
  | 'rooms.errorNotStartable'
  | 'match.giveUp'
  | 'match.giveUpConfirm'
  | 'match.waitingOpponentAnswer'
  | 'match.nextRoundIn'
  | 'match.finalScore'
  | 'match.winnerLabel'
  | 'match.tieLabel'
  | 'match.backToRoom'
  | 'match.gaveUpTag'
  | 'match.roundLabel'
  | 'match.pointsLabel'
  | 'match.errorRoundAlreadyActive'
  | 'match.errorAlreadyAnswered'
  | 'match.errorRoundNotActive'
  | 'match.errorMatchComplete'
  | 'match.errorRoundNotExpired'
  | 'match.errorNotParticipant'
  | 'match.errorRoundNotFound'
  | 'match.playAgain'
  | 'match.resultsTitle'
  | 'match.timedOutTag'
  | 'rooms.errorRematchNotAvailable';

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
    'flag.multiplayer': 'Multi​player',
    'flag.solo': 'Solo',
    'profile.playingAs': 'Jogando como',
    'profile.noSessionPrompt': 'Escolha um nickname na tela de multiplayer para jogar.',
    'profile.changePhoto': 'Trocar foto',
    'profile.signOut': 'Sair',
    'profile.mode.padrao': 'Padrão',
    'profile.mode.vulto': 'Vulto',
    'profile.mode.pretoEBranco': 'Preto e Branco',
    'profile.mode.anomaly': 'Anomaly',
    'mp.subtitle': 'Multiplayer',
    'mp.description':
      'Desafie um amigo ou encontre um adversário: os dois veem a mesma splash art ao mesmo tempo, em 5 rodadas — quem adivinhar primeiro pontua mais. No fim, quem somar mais pontos vence.',
    'mp.nicknamePlaceholder': 'Seu nickname…',
    'mp.confirm': 'Confirmar',
    'mp.greeting': 'Olá,',
    'mp.play': 'Jogar',
    'mp.errorNicknameTaken': 'Esse nickname já está em uso. Escolha outro.',
    'auth.genericError': 'Algo deu errado. Tente novamente.',
    'auth.backToMultiplayer': 'Voltar',
    'auth.errorAnonymousDisabled': 'O modo anônimo está temporariamente indisponível.',
    'rooms.comingSoon': 'Criar ou entrar em uma sala chega na próxima fase.',
    'rooms.createTitle': 'Criar sala',
    'rooms.chooseMode': 'Escolha o modo',
    'rooms.createButton': 'Criar sala',
    'rooms.joinTitle': 'Entrar com código',
    'rooms.codePlaceholder': 'Código da sala',
    'rooms.joinButton': 'Entrar',
    'rooms.lobbyCodeLabel': 'Código da sala',
    'rooms.copyCode': 'Copiar',
    'rooms.copied': 'Copiado!',
    'rooms.waitingOpponent': 'Aguardando oponente…',
    'rooms.startMatch': 'Iniciar partida',
    'rooms.cancelRoom': 'Cancelar sala',
    'rooms.leaveRoom': 'Sair da sala',
    'rooms.hostLabel': 'Anfitrião',
    'rooms.guestLabel': 'Convidado',
    'rooms.cancelledByHost': 'O anfitrião cancelou a sala.',
    'rooms.matchStub': 'A partida começa na próxima fase.',
    'rooms.errorNotFound': 'Sala não encontrada. Confira o código.',
    'rooms.errorNotJoinable': 'Essa sala já está cheia.',
    'rooms.errorOwnRoom': 'Você não pode entrar na sua própria sala.',
    'rooms.errorNotStartable': 'Não é possível iniciar a partida agora.',
    'match.giveUp': 'Desistir',
    'match.giveUpConfirm': 'Tem certeza? Você não poderá mais tentar nesta rodada.',
    'match.waitingOpponentAnswer': 'Aguardando o oponente…',
    'match.nextRoundIn': 'Próxima rodada em instantes…',
    'match.finalScore': 'Placar final',
    'match.winnerLabel': 'Vencedor',
    'match.tieLabel': 'Empate!',
    'match.backToRoom': 'Voltar à sala',
    'match.gaveUpTag': 'Desistiu',
    'match.roundLabel': 'Rodada',
    'match.pointsLabel': 'pontos',
    'match.errorRoundAlreadyActive': 'A rodada já começou.',
    'match.errorAlreadyAnswered': 'Você já respondeu esta rodada.',
    'match.errorRoundNotActive': 'Essa rodada já terminou.',
    'match.errorMatchComplete': 'A partida já terminou.',
    'match.errorRoundNotExpired': 'O tempo ainda não acabou.',
    'match.errorNotParticipant': 'Você não faz parte desta partida.',
    'match.errorRoundNotFound': 'Rodada não encontrada.',
    'match.playAgain': 'Jogar novamente',
    'match.resultsTitle': 'Resultado da partida',
    'match.timedOutTag': 'Tempo esgotado',
    'rooms.errorRematchNotAvailable': 'Não é possível iniciar uma revanche agora.',
  },
  en: {
    'menu.intro':
      'A League of Legends champion splash art shows up zoomed into a random spot of the image. Figure out the right champion and skin — every wrong guess reveals a bit more.',
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
    'flag.multiplayer': 'Multi​player',
    'flag.solo': 'Solo',
    'profile.playingAs': 'Playing as',
    'profile.noSessionPrompt': 'Choose a nickname on the multiplayer screen to play.',
    'profile.changePhoto': 'Change photo',
    'profile.signOut': 'Sign out',
    'profile.mode.padrao': 'Standard',
    'profile.mode.vulto': 'Shade',
    'profile.mode.pretoEBranco': 'Black & White',
    'profile.mode.anomaly': 'Anomaly',
    'mp.subtitle': 'Multiplayer',
    'mp.description':
      "Challenge a friend or find an opponent: you both see the same splash art at the same time, across 5 rounds — the faster guess scores more. Whoever has the most points at the end wins.",
    'mp.nicknamePlaceholder': 'Your nickname…',
    'mp.confirm': 'Confirm',
    'mp.greeting': 'Hi,',
    'mp.play': 'Play',
    'mp.errorNicknameTaken': "That nickname is already taken. Choose another.",
    'auth.genericError': 'Something went wrong. Please try again.',
    'auth.backToMultiplayer': 'Back',
    'auth.errorAnonymousDisabled': 'Anonymous mode is temporarily unavailable.',
    'rooms.comingSoon': 'Creating or joining a room lands in the next phase.',
    'rooms.createTitle': 'Create a room',
    'rooms.chooseMode': 'Choose a mode',
    'rooms.createButton': 'Create room',
    'rooms.joinTitle': 'Join with a code',
    'rooms.codePlaceholder': 'Room code',
    'rooms.joinButton': 'Join',
    'rooms.lobbyCodeLabel': 'Room code',
    'rooms.copyCode': 'Copy',
    'rooms.copied': 'Copied!',
    'rooms.waitingOpponent': 'Waiting for opponent…',
    'rooms.startMatch': 'Start match',
    'rooms.cancelRoom': 'Cancel room',
    'rooms.leaveRoom': 'Leave room',
    'rooms.hostLabel': 'Host',
    'rooms.guestLabel': 'Guest',
    'rooms.cancelledByHost': 'The host cancelled the room.',
    'rooms.matchStub': 'The match starts in the next phase.',
    'rooms.errorNotFound': 'Room not found. Check the code.',
    'rooms.errorNotJoinable': "That room is already full.",
    'rooms.errorOwnRoom': "You can't join your own room.",
    'rooms.errorNotStartable': "Can't start the match right now.",
    'match.giveUp': 'Give up',
    'match.giveUpConfirm': "Are you sure? You won't be able to guess again this round.",
    'match.waitingOpponentAnswer': 'Waiting for opponent…',
    'match.nextRoundIn': 'Next round starting soon…',
    'match.finalScore': 'Final score',
    'match.winnerLabel': 'Winner',
    'match.tieLabel': "It's a tie!",
    'match.backToRoom': 'Back to room',
    'match.gaveUpTag': 'Gave up',
    'match.roundLabel': 'Round',
    'match.pointsLabel': 'points',
    'match.errorRoundAlreadyActive': 'The round already started.',
    'match.errorAlreadyAnswered': "You've already answered this round.",
    'match.errorRoundNotActive': 'This round is already over.',
    'match.errorMatchComplete': 'The match is already over.',
    'match.errorRoundNotExpired': "Time isn't up yet.",
    'match.errorNotParticipant': "You're not part of this match.",
    'match.errorRoundNotFound': 'Round not found.',
    'match.playAgain': 'Play again',
    'match.resultsTitle': 'Match results',
    'match.timedOutTag': 'Timed out',
    'rooms.errorRematchNotAvailable': "Can't start a rematch right now.",
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
