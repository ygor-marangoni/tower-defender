(function cardChoiceModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  function createCardChoiceState(overrides = {}) {
    return {
      isOpen: false,
      choices: [],
      triggeredForWave: null,
      nextChoiceWaveInterval: 3,
      chosenCards: [],
      ...overrides,
      choices: Array.isArray(overrides.choices) ? [...overrides.choices] : [],
      chosenCards: Array.isArray(overrides.chosenCards) ? [...overrides.chosenCards] : []
    };
  }

  function shouldOpenCardChoiceAfterWave(completedWave, cardChoice = createCardChoiceState()) {
    const interval = cardChoice.nextChoiceWaveInterval || 3;

    if (!Number.isFinite(completedWave) || completedWave <= 0) {
      return false;
    }

    if (cardChoice.isOpen || cardChoice.triggeredForWave === completedWave) {
      return false;
    }

    return completedWave % interval === 0;
  }

  function openCardChoice(cardChoice, completedWave, deck = TD.UPGRADE_CARDS, rng = Math.random) {
    if (!shouldOpenCardChoiceAfterWave(completedWave, cardChoice)) {
      return {
        opened: false,
        choices: cardChoice.choices
      };
    }

    const choices = TD.generateCardChoices(deck, 3, rng);

    cardChoice.isOpen = true;
    cardChoice.choices = choices;
    cardChoice.triggeredForWave = completedWave;

    return {
      opened: true,
      choices
    };
  }

  function chooseCard(cardChoice, cardId) {
    if (!cardChoice?.isOpen) {
      return {
        chosen: false,
        cardId,
        reason: 'NO_CHOICE_OPEN'
      };
    }

    const card = cardChoice.choices.find((choice) => choice.id === cardId);

    if (!card) {
      return {
        chosen: false,
        cardId,
        reason: 'CARD_NOT_AVAILABLE'
      };
    }

    cardChoice.isOpen = false;
    cardChoice.choices = [];
    cardChoice.chosenCards.push(card.id);

    return {
      chosen: true,
      cardId: card.id,
      card
    };
  }

  function closeCardChoice(cardChoice) {
    if (!cardChoice) {
      return null;
    }

    cardChoice.isOpen = false;
    cardChoice.choices = [];
    return cardChoice;
  }

  TD.createCardChoiceState = createCardChoiceState;
  TD.shouldOpenCardChoiceAfterWave = shouldOpenCardChoiceAfterWave;
  TD.openCardChoice = openCardChoice;
  TD.chooseCard = chooseCard;
  TD.closeCardChoice = closeCardChoice;
})(globalThis);
