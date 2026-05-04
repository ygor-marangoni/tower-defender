(function deckModule(global) {
  const TD = global.TowerDefender = global.TowerDefender || {};

  const RARITY_WEIGHTS = {
    common: 65,
    rare: 27,
    epic: 8
  };
  const RARITY_LABELS = {
    common: 'Comum',
    rare: 'Rara',
    epic: 'Epica'
  };
  const CATEGORY_LABELS = {
    attack: 'Ataque',
    economy: 'Economia',
    defense: 'Defesa',
    specialization: 'Especializacao',
    utility: 'Utilidade'
  };

  const UPGRADE_CARDS = [
    {
      id: 'sharpenedProjectiles',
      rarity: 'common',
      category: 'attack',
      icon: 'crosshair',
      effect: { type: 'multiplyModifier', key: 'globalDamageMultiplier', value: 1.1 },
      display: {
        futuristic: {
          name: 'Projeteis Otimizados',
          description: 'Todas as torres causam +10% de dano.',
          flavor: 'Ajustes finos aumentam a eficiencia dos disparos.'
        },
        medieval: {
          name: 'Pontas Afiadas',
          description: 'Todas as defesas causam +10% de dano.',
          flavor: 'Ferreiros do reino reforcam as armas da muralha.'
        }
      }
    },
    {
      id: 'expandedRange',
      rarity: 'common',
      category: 'attack',
      icon: 'radar',
      effect: { type: 'multiplyModifier', key: 'globalRangeMultiplier', value: 1.08 },
      display: {
        futuristic: {
          name: 'Sensor Expandido',
          description: 'Todas as torres ganham +8% de alcance.',
          flavor: 'Sensores ampliados encontram alvos mais cedo.'
        },
        medieval: {
          name: 'Vigias Altas',
          description: 'Todas as defesas ganham +8% de alcance.',
          flavor: 'Sentinelas sobem nas torres mais altas do reino.'
        }
      }
    },
    {
      id: 'fasterReload',
      rarity: 'rare',
      category: 'attack',
      icon: 'zap',
      effect: { type: 'multiplyModifier', key: 'globalCooldownMultiplier', value: 0.92 },
      display: {
        futuristic: {
          name: 'Recarga Acelerada',
          description: 'Todas as torres reduzem cooldown em 8%.',
          flavor: 'Rotinas de disparo removem atrasos desnecessarios.'
        },
        medieval: {
          name: 'Maos Treinadas',
          description: 'Todas as defesas disparam 8% mais rapido.',
          flavor: 'Guarnicoes treinadas recarregam sem hesitar.'
        }
      }
    },
    {
      id: 'criticalStrike',
      rarity: 'rare',
      category: 'attack',
      icon: 'target',
      effect: { type: 'multiplyModifier', key: 'globalDamageMultiplier', value: 1.05 },
      display: {
        futuristic: {
          name: 'Nucleo Critico',
          description: 'Todas as torres causam +5% de dano medio.',
          flavor: 'O nucleo prioriza impactos em pontos sensiveis.'
        },
        medieval: {
          name: 'Golpe Preciso',
          description: 'Todas as defesas causam +5% de dano medio.',
          flavor: 'Atiradores miram nas juntas das armaduras.'
        }
      }
    },
    {
      id: 'overchargedArsenal',
      rarity: 'epic',
      category: 'attack',
      icon: 'sparkles',
      effect: [
        { type: 'multiplyModifier', key: 'globalDamageMultiplier', value: 1.18 },
        { type: 'multiplyModifier', key: 'towerCostMultiplier', value: 1.08 }
      ],
      display: {
        futuristic: {
          name: 'Arsenal Sobrecarregado',
          description: 'Torres ganham +18% de dano, mas novas torres custam +8%.',
          flavor: 'Energia extra aumenta potencia e desgaste logistico.'
        },
        medieval: {
          name: 'Arsenal Real',
          description: 'Defesas ganham +18% de dano, mas novas defesas custam +8%.',
          flavor: 'As melhores armas do rei exigem mais recursos.'
        }
      }
    },
    {
      id: 'bountyHunter',
      rarity: 'common',
      category: 'economy',
      icon: 'coins',
      effect: { type: 'multiplyModifier', key: 'rewardMultiplier', value: 1.15 },
      display: {
        futuristic: {
          name: 'Protocolo de Recompensa',
          description: 'Inimigos derrotados dao +15% de creditos.',
          flavor: 'Cada baixa vira dados negociaveis.'
        },
        medieval: {
          name: 'Cacadores de Recompensa',
          description: 'Inimigos derrotados dao +15% de ouro.',
          flavor: 'Mercenarios recolhem espolios pelo campo.'
        }
      }
    },
    {
      id: 'emergencyFunds',
      rarity: 'common',
      category: 'economy',
      icon: 'badge-dollar-sign',
      effect: { type: 'addMoney', value: 80 },
      display: {
        futuristic: {
          name: 'Creditos Emergenciais',
          description: 'Ganha 80 creditos imediatamente.',
          flavor: 'Uma reserva automatica libera verba extra.'
        },
        medieval: {
          name: 'Tesouro do Reino',
          description: 'Ganha 80 ouro imediatamente.',
          flavor: 'O tesouro abre os cofres para a defesa.'
        }
      }
    },
    {
      id: 'efficientConstruction',
      rarity: 'rare',
      category: 'economy',
      icon: 'wrench',
      effect: { type: 'multiplyModifier', key: 'towerCostMultiplier', value: 0.9 },
      display: {
        futuristic: {
          name: 'Construcao Eficiente',
          description: 'Torres novas custam 10% menos.',
          flavor: 'Modulos padronizados reduzem desperdicio.'
        },
        medieval: {
          name: 'Maos de Obra Local',
          description: 'Defesas novas custam 10% menos.',
          flavor: 'Artesaos locais conhecem cada pedra da fortaleza.'
        }
      }
    },
    {
      id: 'merchantContract',
      rarity: 'rare',
      category: 'economy',
      icon: 'hand-coins',
      effect: { type: 'setSellRatio', value: 0.85 },
      display: {
        futuristic: {
          name: 'Contrato Logistico',
          description: 'Venda de torres devolve 85% do investido.',
          flavor: 'Recuperacao de pecas fica mais eficiente.'
        },
        medieval: {
          name: 'Contrato Mercante',
          description: 'Venda de defesas devolve 85% do investido.',
          flavor: 'Mercadores pagam melhor por armas intactas.'
        }
      }
    },
    {
      id: 'goldenWave',
      rarity: 'epic',
      category: 'economy',
      icon: 'gem',
      effect: { type: 'multiplyModifier', key: 'rewardMultiplier', value: 1.25 },
      display: {
        futuristic: {
          name: 'Extracao de Dados',
          description: 'Recompensas de inimigos aumentam +25% permanentemente.',
          flavor: 'Cada alvo destruido rende pacotes valiosos.'
        },
        medieval: {
          name: 'Saque de Guerra',
          description: 'Recompensas de inimigos aumentam +25% permanentemente.',
          flavor: 'Os invasores carregam suprimentos demais.'
        }
      }
    },
    {
      id: 'reinforcedBase',
      rarity: 'common',
      category: 'defense',
      icon: 'shield',
      effect: { type: 'addLife', value: 3 },
      display: {
        futuristic: {
          name: 'Blindagem do Nucleo',
          description: 'Ganha +3 de vida.',
          flavor: 'Camadas extras seguram a linha central.'
        },
        medieval: {
          name: 'Muralhas Reforcadas',
          description: 'Ganha +3 de vida.',
          flavor: 'Pedreiros reforcam os pontos mais fracos.'
        }
      }
    },
    {
      id: 'lastStand',
      rarity: 'rare',
      category: 'defense',
      icon: 'shield-alert',
      effect: { type: 'multiplyModifier', key: 'lowLifeDamageMultiplier', value: 1.15 },
      display: {
        futuristic: {
          name: 'Protocolo Ultima Linha',
          description: 'Com 5 vidas ou menos, torres ganham +15% de dano.',
          flavor: 'A defesa entra em modo de emergencia.'
        },
        medieval: {
          name: 'Ultima Muralha',
          description: 'Com 5 vidas ou menos, defesas ganham +15% de dano.',
          flavor: 'A guarnicao luta melhor quando tudo esta em risco.'
        }
      }
    },
    {
      id: 'repairDrones',
      rarity: 'epic',
      category: 'defense',
      icon: 'heart-pulse',
      effect: { type: 'addModifier', key: 'baseRepairEveryThreeWaves', value: 1 },
      display: {
        futuristic: {
          name: 'Drones de Reparo',
          description: 'A cada 3 ondas futuras, recupera +1 vida.',
          flavor: 'Microdrones remendam danos entre ataques.'
        },
        medieval: {
          name: 'Curandeiros do Reino',
          description: 'A cada 3 cercos futuros, recupera +1 vida.',
          flavor: 'Curandeiros e carpinteiros trabalham lado a lado.'
        }
      }
    },
    {
      id: 'archerTraining',
      rarity: 'common',
      category: 'specialization',
      icon: 'crosshair',
      effect: { type: 'multiplyModifier', key: 'basicDamageMultiplier', value: 1.15 },
      display: {
        futuristic: {
          name: 'Calibracao do Canhao',
          description: 'Torres basic ganham +15% de dano.',
          flavor: 'Canhoes principais recebem calibragem fina.'
        },
        medieval: {
          name: 'Treinamento dos Arqueiros',
          description: 'Defesas basic ganham +15% de dano.',
          flavor: 'Arqueiros treinam em alvos menores e mais distantes.'
        }
      }
    },
    {
      id: 'rapidMechanism',
      rarity: 'rare',
      category: 'specialization',
      icon: 'zap',
      effect: { type: 'multiplyModifier', key: 'rapidCooldownMultiplier', value: 0.85 },
      display: {
        futuristic: {
          name: 'Laser Sequencial',
          description: 'Torres rapid reduzem cooldown em 15%.',
          flavor: 'Sequenciamento alternado mantem o disparo constante.'
        },
        medieval: {
          name: 'Mecanismo da Besta',
          description: 'Defesas rapid reduzem cooldown em 15%.',
          flavor: 'Engrenagens melhores aceleram a recarga.'
        }
      }
    },
    {
      id: 'siegeMastery',
      rarity: 'rare',
      category: 'specialization',
      icon: 'flame',
      effect: { type: 'multiplyModifier', key: 'heavyDamageMultiplier', value: 1.2 },
      display: {
        futuristic: {
          name: 'Plasma Pesado',
          description: 'Torres heavy ganham +20% de dano.',
          flavor: 'O plasma concentrado quebra blindagens densas.'
        },
        medieval: {
          name: 'Mestre de Cerco',
          description: 'Defesas heavy ganham +20% de dano.',
          flavor: 'Artilheiros aprendem a mirar onde a armadura cede.'
        }
      }
    },
    {
      id: 'royalEngineer',
      rarity: 'epic',
      category: 'specialization',
      icon: 'hammer',
      effect: [
        { type: 'multiplyModifier', key: 'globalDamageMultiplier', value: 1.1 },
        { type: 'multiplyModifier', key: 'globalRangeMultiplier', value: 1.05 }
      ],
      display: {
        futuristic: {
          name: 'Engenheiro de Campo',
          description: 'Todas as torres ganham +10% de dano e +5% de alcance.',
          flavor: 'Um especialista reconfigura toda a linha defensiva.'
        },
        medieval: {
          name: 'Engenheiro Real',
          description: 'Todas as defesas ganham +10% de dano e +5% de alcance.',
          flavor: 'O engenheiro real aperfeicoa cada estrutura.'
        }
      }
    },
    {
      id: 'tacticalVision',
      rarity: 'common',
      category: 'utility',
      icon: 'eye',
      effect: [
        { type: 'multiplyModifier', key: 'globalRangeMultiplier', value: 1.05 },
        { type: 'addModifier', key: 'rangeClarityBonus', value: 1 }
      ],
      display: {
        futuristic: {
          name: 'Visao Tatica',
          description: 'Alcance fica mais claro e aumenta +5%.',
          flavor: 'A interface destaca zonas de cobertura importantes.'
        },
        medieval: {
          name: 'Olhos da Fortaleza',
          description: 'Alcance fica mais claro e aumenta +5%.',
          flavor: 'Batedores marcam os melhores pontos de vigia.'
        }
      }
    },
    {
      id: 'veteranDefenders',
      rarity: 'rare',
      category: 'utility',
      icon: 'star',
      effect: { type: 'multiplyModifier', key: 'placedTowerDamageMultiplier', value: 1.1 },
      display: {
        futuristic: {
          name: 'Unidades Veteranas',
          description: 'Torres ja posicionadas ganham +10% de dano.',
          flavor: 'Sistemas em campo aprendem com combate real.'
        },
        medieval: {
          name: 'Defensores Veteranos',
          description: 'Defesas ja posicionadas ganham +10% de dano.',
          flavor: 'Veteranos seguram a linha com disciplina.'
        }
      }
    },
    {
      id: 'perfectDefense',
      rarity: 'epic',
      category: 'utility',
      icon: 'sparkles',
      effect: { type: 'addModifier', key: 'perfectWaveBonus', value: 40 },
      display: {
        futuristic: {
          name: 'Execucao Perfeita',
          description: 'Se uma onda terminar sem perder vida, ganha +40 creditos.',
          flavor: 'Defesas impecaveis geram bonus operacional.'
        },
        medieval: {
          name: 'Defesa Impecavel',
          description: 'Se um cerco terminar sem perder vida, ganha +40 ouro.',
          flavor: 'O reino recompensa muralhas intactas.'
        }
      }
    }
  ];

  function getCardById(cardId, deck = UPGRADE_CARDS) {
    return deck.find((card) => card.id === cardId) || null;
  }

  function getCardsByRarity(rarity, deck = UPGRADE_CARDS) {
    return deck.filter((card) => card.rarity === rarity);
  }

  function getRarityFromRoll(roll) {
    const boundedRoll = Math.max(0, Math.min(0.999999, Number(roll) || 0));
    const scaledRoll = boundedRoll * 100;
    let cursor = 0;

    for (const rarity of ['common', 'rare', 'epic']) {
      cursor += RARITY_WEIGHTS[rarity];

      if (scaledRoll < cursor) {
        return rarity;
      }
    }

    return 'common';
  }

  function pickRandomCard(cards, rng) {
    if (!cards.length) {
      return null;
    }

    const index = Math.min(cards.length - 1, Math.floor(rng() * cards.length));
    return cards[index];
  }

  function generateCardChoices(deck = UPGRADE_CARDS, count = 3, rng = Math.random) {
    const choices = [];
    const selectedIds = new Set();
    const safeRng = typeof rng === 'function' ? rng : Math.random;
    const maxAttempts = Math.max(30, count * deck.length * 2);
    let attempts = 0;

    while (choices.length < count && selectedIds.size < deck.length && attempts < maxAttempts) {
      attempts += 1;
      const rarity = getRarityFromRoll(safeRng());
      const rarityPool = deck.filter((card) => card.rarity === rarity && !selectedIds.has(card.id));
      const fallbackPool = deck.filter((card) => !selectedIds.has(card.id));
      const card = pickRandomCard(rarityPool.length ? rarityPool : fallbackPool, safeRng);

      if (!card || selectedIds.has(card.id)) {
        continue;
      }

      selectedIds.add(card.id);
      choices.push(card);
    }

    return choices;
  }

  function getCardDisplayData(cardOrId, themeId = TD.DEFAULT_THEME_ID) {
    const card = typeof cardOrId === 'string' ? getCardById(cardOrId) : cardOrId;

    if (!card) {
      return null;
    }

    const theme = TD.getThemeById ? TD.getThemeById(themeId) : { id: themeId };
    const themedDisplay = card.display?.[theme.id] || card.display?.futuristic || {};

    return {
      id: card.id,
      rarity: card.rarity,
      rarityLabel: RARITY_LABELS[card.rarity] || card.rarity,
      category: card.category,
      categoryLabel: CATEGORY_LABELS[card.category] || card.category,
      icon: card.icon || 'sparkles',
      name: themedDisplay.name || card.id,
      description: themedDisplay.description || '',
      flavor: themedDisplay.flavor || '',
      effect: card.effect
    };
  }

  TD.CARD_RARITY_WEIGHTS = RARITY_WEIGHTS;
  TD.UPGRADE_CARDS = UPGRADE_CARDS;
  TD.getCardById = getCardById;
  TD.getCardsByRarity = getCardsByRarity;
  TD.getRarityFromRoll = getRarityFromRoll;
  TD.generateCardChoices = generateCardChoices;
  TD.getCardDisplayData = getCardDisplayData;
})(globalThis);
