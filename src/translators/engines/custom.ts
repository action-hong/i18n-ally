import path from 'path'
import fs from 'fs'
import axios from 'axios'
import TranslateEngine, { TranslateOptions, TranslateResult } from './base'
import { File } from '~/utils'
import { Global, Config } from '~/core'

type CustomWords = Array<Record<string, string>>

let words: CustomWords = []

export default class CustomTranslate extends TranslateEngine {
  async translate(options: TranslateOptions) {
    const {
      from = 'auto',
      to = 'auto',
    } = options

    // local file
    const text = options.text

    const r: TranslateResult = {
      text,
      to,
      from,
      response: {},
      linkToResult: '',
    }

    const services = Config.getCustomServices()

    for (const service of services) {
      words = []
      if (service.category === 'file') {
        const filename = path.resolve(Global.rootpath, service.url)
        if (!fs.existsSync(filename)) {
          r.error = new Error(`No Found local custom word file: ${filename}`)
          continue
        }

        try {
          words = JSON.parse(File.readSync(filename))
        }
        catch (error) {
          r.error = error as any
          continue
        }
      }
      else if (service.category === 'http') {
        // todo: fetch words from http
        words = await getWordsFromHttp(service.url)
      }

      const item = words.find(item => item[from] === text)
      if (item && item[to]) {
        r.result = [item[to]]
        return Promise.resolve(r)
      }
      continue
    }

    r.error = new Error('No Found')
    return Promise.resolve(r)
  }
}

async function getWordsFromHttp(url: string) {
  try {
    const res = await axios.get(url)
    return res.data
  }
  catch (error) {
    return []
  }
}
