import vippsConfig from '../config/vipps.js';
import Client from 'ssh2-sftp-client';
import fs from 'fs-extra';
import parser from 'fast-xml-parser';
import * as settlement from '../repositories/settlement.js';
import moment from 'moment';
import { publishMessage, topics } from '../services/pubsub/index.js';
import logger from '../services/logger.js';

export const schedule = '0 12 * * *';

export default async () => {
    let sftp = new Client();

    await sftp.connect({
        host: 'sftp.vipps.no',
        username: 'linux hjemme - stor PC',
        privateKey: vippsConfig.sshPrivateKey,
    });

    const tmpDirectory = './tmp';
    await fs.ensureDir(tmpDirectory);
    const settlementFileDirectory = `/settlements/inbox/xml/${vippsConfig.orgNr}/${vippsConfig.merchantId}`;
    const settlementFiles = await sftp.list(settlementFileDirectory);

    for (let settlementFile of settlementFiles) {
        let remotePath = `${settlementFileDirectory}/${settlementFile.name}`;
        let dstPath = `${tmpDirectory}/${settlementFile.name}`;
        let dst = fs.createWriteStream(dstPath);

        await sftp.get(remotePath, dst);

        const xml = fs.readFileSync(dstPath).toString();

        const settlementInfo = parser.parse(xml);
        if (
            settlementInfo.SettlementReport &&
            settlementInfo.SettlementReport.SettlementDetailsInfo &&
            settlementInfo.SettlementReport.SettlementDetailsInfo
                .PaymentsInfo &&
            settlementInfo.SettlementReport.SettlementDetailsInfo.PaymentsInfo
                .SettlementInfo
        ) {
            const info = {
                date:
                    settlementInfo.SettlementReport.SettlementDetailsInfo
                        .PaymentsInfo.SettlementInfo.SettlementDate,
                amountToBankAccount:
                    settlementInfo.SettlementReport.SettlementDetailsInfo
                        .PaymentsInfo.SettlementInfo.NetSettlementAmount,
                fees:
                    settlementInfo.SettlementReport.SettlementDetailsInfo
                        .PaymentsInfo.SettlementInfo.FeeSettlementAmount,
            };

            const estimatedDateOnBankAccount = moment(info.date).add(2, 'days');
            if (
                [6, 7].indexOf(estimatedDateOnBankAccount.isoWeekday()) !== -1
            ) {
                estimatedDateOnBankAccount.add(1, 'week').startOf('isoWeek');
            }

            let dbSettlement = await settlement.getByDate(info.date);
            if (!dbSettlement) {
                dbSettlement = await settlement.create({
                    date: info.date,
                    estimatedDateOnBankAccount: estimatedDateOnBankAccount.format(
                        'YYYY-MM-DD'
                    ),
                    amountToBankAccount: info.amountToBankAccount,
                    fees: info.fees,
                });

                await publishMessage(topics.NEW_VIPPS_SETTLEMENT, {
                    vippsSettlement: {
                        ...dbSettlement,
                        date: moment(dbSettlement.date).format('YYYY-MM-DD'),
                        estimatedDateOnBankAccount: moment(
                            dbSettlement.estimatedDateOnBankAccount
                        ).format('YYYY-MM-DD'),
                    },
                });
            }
        }
    }
};
