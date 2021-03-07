import vippsConfig from './config/vipps.js';
import Client from 'ssh2-sftp-client';
import fs from 'fs-extra';
import parser from 'fast-xml-parser';

const run = async () => {
    let sftp = new Client();
    await sftp.connect({
        host: 'sftp.vipps.no',
        username: 'linux hjemme - stor PC',
        privateKey: vippsConfig.privateKey,
    });

    const tmpDirectory = './tmp';
    await fs.ensureDir(tmpDirectory);
    const settlementFileDirectory = `/settlements/inbox/xml/${vippsConfig.orgNr}/${vippsConfig.merchantId}`;
    const settlementFiles = await sftp.list(settlementFileDirectory);
    console.log(settlementFiles);

    for (let settlementFile of settlementFiles) {
        console.log(`${settlementFileDirectory}/${settlementFile.name}`);
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
            console.log(settlementInfo.SettlementReport.SettlementDetailsInfo);
        }
    }
};

run()
    .then(() => process.exit())
    .catch((e) => console.error(e) && process.exit());
