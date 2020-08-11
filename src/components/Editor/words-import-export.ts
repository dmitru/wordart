import { ImportedWord } from './editor-store'
import { WordListEntry } from './style-options'

export const csvDataToWords = (data: any[]): ImportedWord[] => {
  return data.map((row) => {
    const word: ImportedWord = { text: row.text }
    if (row.color) {
      word.color = row.color
    }
    if (row.angle != null) {
      word.angle = row.angle
    }
    if (row.font) {
      word.fontId = row.font
    }
    if (row.repeats != null) {
      word.repeats = row.repeats
    }
    return word
  })
}

export const wordsToCSVData = (words: WordListEntry[]): object[] => {
  return words.map((w) => {
    let repeats = (w.repeats ?? -1) === -1 ? '' : w.repeats
    const angle = w.angle ?? ''
    const font = w.fontId ?? ''
    const color = w.color ?? ''
    const text = w.text

    return {
      text,
      repeats,
      angle,
      color,
      font,
    }
  })
}
