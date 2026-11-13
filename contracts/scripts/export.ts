import * as fs from "fs";
import * as path from "path";

export function exportContractData(address: string) {
    const abiSource = path.join(__dirname, "../artifacts/contracts/GroupTask.sol/GroupTask.json");
    const abiDestDir = path.join(__dirname, "../../shared/abi");
    const addressDest = path.join(__dirname, "../../shared/addresses.json");

    if (!fs.existsSync(abiDestDir)) fs.mkdirSync(abiDestDir, { recursive: true });

    const artifact = JSON.parse(fs.readFileSync(abiSource, "utf8"));
    fs.writeFileSync(path.join(abiDestDir, "GroupTask.json"), JSON.stringify(artifact.abi, null, 2));

    const addressData = { "43113": address };
    fs.writeFileSync(addressDest, JSON.stringify(addressData, null, 2));
    console.log("✅ Đã export ABI và Address ra thư mục shared/");
}