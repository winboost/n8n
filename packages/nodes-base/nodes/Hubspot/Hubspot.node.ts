import {
	IExecuteFunctions,
} from 'n8n-core';
import {
	IDataObject,
	INodeTypeDescription,
	INodeExecutionData,
	INodeType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import {
	hubspotApiRequest,
	hubspotApiRequestAllItems,
	validateJSON,
 } from './GenericFunctions';
import {
	dealOperations,
	dealFields,
} from '../Hubspot/DealDescription';

export class Hubspot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hubspot',
		name: 'hubspot',
		icon: 'file:hubspot.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Hubspot API',
		defaults: {
			name: 'Hubspot',
			color: '#356ae6',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'hubspotApi',
				required: true,
			}
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Deal',
						value: 'deal',
					},
				],
				default: 'deal',
				description: 'Resource to consume.',
			},

			// Deal
			...dealOperations,
			...dealFields,
		],
	};

	methods = {
		loadOptions: {
			// Get all the groups to display them to user so that he can
			// select them easily
			async getDealStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				let stages;
				try {
					const endpoint = '/crm-pipelines/v1/pipelines/deals';
					stages = await hubspotApiRequest.call(this, 'GET', endpoint, {});
					stages = stages.results[0].stages;
					console.log(stages)
				} catch (err) {
					throw new Error(`Hubspot Error: ${err}`);
				}
				for (const stage of stages) {
					const stageName = stage.label;
					const stageId = stage.stageId;
					returnData.push({
						name: stageName,
						value: stageId,
					});
				}
				return returnData;
			},

			// Get all the companies to display them to user so that he can
			// select them easily
			async getCompanies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				let companies;
				try {
					const endpoint = '/companies/v2/companies/paged';
					companies = await hubspotApiRequestAllItems.call(this, 'results', 'GET', endpoint);
				} catch (err) {
					throw new Error(`Hubspot Error: ${err}`);
				}
				for (const company of companies) {
					const companyName = company.properties.name.value;
					const companyId = company.companyId;
					returnData.push({
						name: companyName,
						value: companyId,
					});
				}
				return returnData;
			},

			// Get all the companies to display them to user so that he can
			// select them easily
			async getContacts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				let contacts;
				try {
					const endpoint = '/contacts/v1/lists/all/contacts/all';
					contacts = await hubspotApiRequestAllItems.call(this, 'contacts', 'GET', endpoint);
				} catch (err) {
					throw new Error(`Hubspot Error: ${err}`);
				}
				for (const contact of contacts) {
					const contactName = `${contact.properties.firstname.value} ${contact.properties.lastname.value}` ;
					const contactId = contact.vid;
					returnData.push({
						name: contactName,
						value: contactId,
					});
				}
				return returnData;
			}
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// const items = this.getInputData();
		// const returnData: IDataObject[] = [];
		// const length = items.length as unknown as number;
		// let responseData;
		// const qs: IDataObject = {};

		// const resource = this.getNodeParameter('resource', 0) as string;
		// const operation = this.getNodeParameter('operation', 0) as string;

		// for (let i = 0; i < length; i++) {
		// 	if (resource === 'payout') {
		// 		if (operation === 'create') {
		// 			const body: IPaymentBatch = {};
		// 			const header: ISenderBatchHeader = {};
		// 			const jsonActive = this.getNodeParameter('jsonParameters', i) as boolean;
		// 			const senderBatchId = this.getNodeParameter('senderBatchId', i) as string;
		// 			const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
		// 			header.sender_batch_id = senderBatchId;
		// 			if (additionalFields.emailSubject) {
		// 				header.email_subject = additionalFields.emailSubject as string;
		// 			}
		// 			if (additionalFields.emailMessage) {
		// 				header.email_message = additionalFields.emailMessage as string;
		// 			}
		// 			if (additionalFields.note) {
		// 				header.note = additionalFields.note as string;
		// 			}
		// 			body.sender_batch_header = header;
		// 			if (!jsonActive) {
		// 				const payoutItems: IItem[] = [];
		// 				const itemsValues = (this.getNodeParameter('itemsUi', i) as IDataObject).itemsValues as IDataObject[];
		// 				if (itemsValues && itemsValues.length > 0) {
		// 					itemsValues.forEach(o => {
		// 						const payoutItem: IItem = {};
		// 						const amount: IAmount = {};
		// 						amount.currency = o.currency as string;
		// 						amount.value = parseFloat(o.amount as string);
		// 						payoutItem.amount = amount;
		// 						payoutItem.note = o.note as string || '';
		// 						payoutItem.receiver = o.receiverValue as string;
		// 						payoutItem.recipient_type = o.recipientType as RecipientType;
		// 						payoutItem.recipient_wallet = o.recipientWallet as RecipientWallet;
		// 						payoutItem.sender_item_id = o.senderItemId as string || '';
		// 						payoutItems.push(payoutItem);
		// 					});
		// 					body.items = payoutItems;
		// 				} else {
		// 					throw new Error('You must have at least one item.');
		// 				}
		// 			} else {
		// 				const itemsJson = validateJSON(this.getNodeParameter('itemsJson', i) as string);
		// 				body.items = itemsJson;
		// 			}
		// 			try {
		// 				responseData = await payPalApiRequest.call(this, '/payments/payouts', 'POST', body);
		// 			} catch (err) {
		// 				throw new Error(`PayPal Error: ${JSON.stringify(err)}`);
		// 			}
		// 		}
		// 		if (operation === 'get') {
		// 			const payoutBatchId = this.getNodeParameter('payoutBatchId', i) as string;
		// 			const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
		// 			try {
		// 				if (returnAll === true) {
		// 					responseData = await payPalApiRequestAllItems.call(this, 'items', `/payments/payouts/${payoutBatchId}`, 'GET', {}, qs);
		// 				} else {
		// 					qs.page_size = this.getNodeParameter('limit', i) as number;
		// 					responseData = await payPalApiRequest.call(this, `/payments/payouts/${payoutBatchId}`, 'GET', {}, qs);
		// 					responseData = responseData.items;
		// 				}
		// 			} catch (err) {
		// 				throw new Error(`PayPal Error: ${JSON.stringify(err)}`);
		// 			}
		// 		}
		// 	} else if (resource === 'payoutItem') {
		// 		if (operation === 'get') {
		// 			const payoutItemId = this.getNodeParameter('payoutItemId', i) as string;
		// 			try {
		// 				responseData = await payPalApiRequest.call(this,`/payments/payouts-item/${payoutItemId}`, 'GET', {}, qs);
		// 			} catch (err) {
		// 				throw new Error(`PayPal Error: ${JSON.stringify(err)}`);
		// 			}
		// 		}
		// 		if (operation === 'cancel') {
		// 			const payoutItemId = this.getNodeParameter('payoutItemId', i) as string;
		// 			try {
		// 				responseData = await payPalApiRequest.call(this,`/payments/payouts-item/${payoutItemId}/cancel`, 'POST', {}, qs);
		// 			} catch (err) {
		// 				throw new Error(`PayPal Error: ${JSON.stringify(err)}`);
		// 			}
		// 		}
		// 	}
		// 	if (Array.isArray(responseData)) {
		// 		returnData.push.apply(returnData, responseData as IDataObject[]);
		// 	} else {
		// 		returnData.push(responseData as IDataObject);
		// 	}
		// }
		return [this.helpers.returnJsonArray({})];
	}
}
