import type {
    Extension,
    ExtensionSetupResult,
    PGliteInterface,
  } from '../interface'
  
  const setup = async (_pg: PGliteInterface, emscriptenOpts: any) => {
    return {
      emscriptenOpts,
      bundlePath: new URL('../../release/timescaledb.tar.gz', import.meta.url),
    } satisfies ExtensionSetupResult
  }
  
  export const timescaledb = {
    name: 'timescaledb',
    setup,
  } satisfies Extension