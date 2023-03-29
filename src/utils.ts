import child_process from 'child_process'
import fsp from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url';

export function getDefaultValue(name:string){
 return child_process.spawnSync(`echo $${name}`,{shell:true,encoding:'utf-8',stdio:'pipe'}).stdout.replace('\n','')
}

const root = process.cwd()
export async function getPkgName(){
  try {
    return JSON.parse(await fsp.readFile(path.resolve(process.cwd(),'./package.json'),'utf-8')).name
  }catch(e){

  }
}
