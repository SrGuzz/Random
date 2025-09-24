import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class Random implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Random',
    name: 'random',
    icon: 'file:random.svg',
    group: ['transform'],
    version: 1,
    description: 'True Random Number Generator (via Random.org)',
    defaults: { name: 'True Random Number Generator' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Min',
        name: 'min',
        type: 'number',
        typeOptions: { minValue: 0 },
        default: 0,
        description: 'Lower bound (inclusive)',
      },
      {
        displayName: 'Max',
        name: 'max',
        type: 'number',
        typeOptions: { minValue: 1 },
        default: 60,
        description: 'Upper bound (inclusive)',
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];

    const count = Math.max(items.length, 1);
    for (let i = 0; i < count; i++) {
      
      //parâmetros ou expressões
      const min = Number(this.getNodeParameter('min', i, 0));
      const max = Number(this.getNodeParameter('max', i, 60));

      // validacao
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error('Min and Max must be finite numbers.');
      }
      if (min > max) {
        throw new Error('Min must be ≤ Max.');
      }

      // chamada a api Randon.org 
      const res = await this.helpers.httpRequest({
        method: 'GET',
        url: 'https://www.random.org/integers/',
        qs: {
          num: 1,
          min,
          max,
          col: 1,
          base: 10,
          format: 'plain',
          rnd: 'new',
        },
        headers: { 'User-Agent': 'n8n Random Custom Node' },
        json: false,             //a resposta é texto
        returnFullResponse: false,
      });

      const text = String(res).trim();
      const value = Number.parseInt(text, 10);
      if (!Number.isInteger(value)) {
        throw new Error(`Unexpected response from Random.org: "${text}"`);
      }

      out.push({
        json: {
          random: value,
          Min: min,
          Max: max,
          source: 'random.org',
          requestedAt: new Date().toLocaleDateString("us-BR"),
        },
      });
    }

    return [out];
  }

}
