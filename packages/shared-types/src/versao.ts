/** Versão servida pelo web (`GET /versao`), usada no aviso de nova versão. */
export interface VersaoWeb {
  versao: string;
  build: string;
}
