// Reviewed regional terminology adaptation; no translation service or app edits.
import fs from 'node:fs';
const file='translations/legal/manual/pt-BR.json';
const original=JSON.parse(fs.readFileSync(file));
const replacements=[
 [/aplicativos/g,'aplicações'],[/aplicativo/g,'aplicação'],[/Aplicativo/g,'Aplicação'],
 [/usuários/g,'utilizadores'],[/usuário/g,'utilizador'],[/Usuário/g,'Utilizador'],
 [/configurações/g,'definições'],[/Configurações/g,'Definições'],
 [/assinaturas/g,'subscrições'],[/assinatura/g,'subscrição'],[/Assinaturas/g,'Subscrições'],
 [/exclusão/g,'eliminação'],[/Exclusão/g,'Eliminação'],[/excluídos/g,'eliminados'],[/exclui/g,'elimina'],[/Excluir/g,'Eliminar'],[/excluir/g,'eliminar'],
 [/banco de dados/g,'base de dados'],[/sistema operacional/g,'sistema operativo'],
 [/criptografia/g,'cifragem'],[/criptografados/g,'cifrados'],[/Compartilhamento/g,'Partilha'],
 [/capturas de tela/gi,'capturas de ecrã'],[/tela de compra/g,'ecrã de compra'],
 [/Gerencie/g,'Faça a gestão de'],[/solicitações/g,'pedidos'],[/solicita\b/g,'pede'],
 [/você concorda/g,'concorda'],[/você escolher/g,'escolher'],[/você conecta/g,'liga'],[/você conectou/g,'ligou'],[/você conectar/g,'ligar'],[/Você também pode/g,'Também pode'],[/você as remova/g,'as remova'],[/você pode/g,'pode'],[/Você pode/g,'Pode'],[/Você é/g,'É'],[/você\./g,'si.'],[/a você/g,'a si'],
 [/conexões/g,'ligações'],[/conexão/g,'ligação'],[/conectados/g,'ligados'],[/conectadas/g,'ligadas'],[/conectou/g,'ligou'],[/conectar/g,'ligar'],[/Desconecte/g,'Desligue']
];
const byIndex=Object.fromEntries(Object.entries(original.byIndex).map(([key,value])=>[key,replacements.reduce((s,[pattern,replacement])=>s.replace(pattern,replacement),value)]));
// Explicit European Portuguese phrasing for sentences affected by verb changes.
Object.assign(byIndex,{
 '10':'Ao utilizar o Nonlate, concorda com estes termos.',
 '54':'Se ligar uma integração Google, o Nonlate pede apenas os âmbitos de acesso Google só de leitura necessários para importar os seus prazos e mantê-los atualizados. Dependendo do serviço Google ligado, o Nonlate pode aceder aos seguintes dados de utilizadores do Google:',
 '56':'Indique a sua plataforma e qualquer identificador anónimo do teste ou da integração disponível na aplicação que seja necessário para localizar os seus registos. O Nonlate não exige início de sessão. Não envie palavras-passe, tokens de acesso dos fornecedores nem dados de cartões de pagamento.',
 '67':'Faça a gestão das subscrições na loja onde as comprou.',
 '68':'Precisa de ajuda com o Nonlate? Contacte o apoio e responderemos assim que possível.',
 '92':'Problemas de início de sessão no fornecedor, permissões ou retorno de autenticação.',
 '32':'Enviar e-mail ao apoio',
 '111':'E-mail do apoio',
 '112':'Apoio | Nonlate',
 '136':'É responsável pelas suas contas de terceiros ligadas e pelas respetivas permissões.'
});
for(const key of Object.keys(byIndex))byIndex[key]=byIndex[key].replace(/registros/g,'registos').replace(/registro/g,'registo').replace(/anônimos/g,'anónimos').replace(/anônimo/g,'anónimo').replace(/confiável/g,'fiável').replace(/confiabilidade/g,'fiabilidade').replace(/confiáveis/g,'fiáveis').replace(/acessar/g,'aceder a').replace(/provedores/g,'fornecedores').replace(/provedor/g,'fornecedor').replace(/suporte/g,'apoio').replace(/celular/g,'telemóvel').replace(/no base de dados/g,'na base de dados').replace(/do base de dados/g,'da base de dados');
for(const key of Object.keys(byIndex))byIndex[key]=byIndex[key].replace(/\bdo aplicação\b/g,'da aplicação').replace(/\bno aplicação\b/g,'na aplicação').replace(/\bao aplicação\b/g,'à aplicação').replace(/\bo aplicação\b/g,'a aplicação').replace(/\bum aplicação\b/g,'uma aplicação').replace(/desinstale-o/g,'desinstale-a').replace(/\bA ecrã(?=\s|$)/g,'O ecrã').replace(/\ba ecrã(?=\s|$)/g,'o ecrã').replace(/Registros/g,'Registos').replace(/desligação/g,'desconexão').replace(/aprendizado de máquina/g,'aprendizagem automática').replace(/contatad/g,'contactad').replace(/contato/g,'contacto');
fs.writeFileSync('translations/legal/manual/pt-PT.json',JSON.stringify({sourceHash:original.sourceHash,byIndex},null,2)+'\n');
