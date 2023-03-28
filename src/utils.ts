import child_process from 'child_process'

export function getDefaultValue(name:string){
 return child_process.spawnSync(`echo $${name}`,{shell:true,encoding:'utf-8',stdio:'pipe'}).stdout.replace('\n','')
}
