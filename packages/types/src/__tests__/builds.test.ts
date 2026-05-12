import {
  buildGameModeFromContentType,
  buildTagLabel,
} from '../builds'

describe('build metadata helpers', () => {
  it('maps primary content types to legacy game mode labels', () => {
    expect(buildGameModeFromContentType('GANK_SOLO')).toBe('Ganking')
    expect(buildGameModeFromContentType('CRYSTAL_ARENA_5V5')).toBe('Crystal Arena')
    expect(buildGameModeFromContentType('FAME_FARM_GROUP_AVALON')).toBe('Fame Farm')
  })

  it('returns localized labels for build tag enums', () => {
    expect(buildTagLabel('contentType', 'HELLGATE_2V2')).toBe('Hellgate (2v2)')
    expect(buildTagLabel('role', 'BURST_DPS')).toBe('Burst DPS')
    expect(buildTagLabel('groupScale', 'SMALL_GROUP')).toBe('Petit groupe')
    expect(buildTagLabel('playstyle', 'ONE_SHOT')).toBe('One shot')
    expect(buildTagLabel('difficulty', 'ADVANCED')).toBe('Avancé')
    expect(buildTagLabel('budget', 'LUXURY')).toBe('Luxe')
  })
})
