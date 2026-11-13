import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const addressPath = path.join(__dirname, "../../shared/addresses.json");
    if (!fs.existsSync(addressPath)) {
        throw new Error("Không tìm thấy file addresses.json. Hãy chạy lệnh deploy trước.");
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    const contractAddress = addresses["43113"];

    if (!contractAddress) {
        throw new Error("Chưa có địa chỉ contract cho mạng Fuji (43113). Hãy chạy lệnh deploy trước.");
    }

    const groupTask = await ethers.getContractAt("GroupTask", contractAddress);
    
    console.log(`Đang seed dữ liệu vào contract: ${contractAddress}...`);

    // 1. Tạo Group
    let tx = await groupTask.createGroup("Nhóm Đồ Án Tốt Nghiệp");
    await tx.wait();
    console.log("✅ Đã tạo Group: Nhóm Đồ Án Tốt Nghiệp (ID: 1)");

    const groupId = 1;

    // 2. Tạo 3 Tasks
    tx = await groupTask.createTask(groupId, "Viết Smart Contract GroupTask");
    await tx.wait();
    
    tx = await groupTask.createTask(groupId, "Làm UI React 3 màn hình");
    await tx.wait();
    
    tx = await groupTask.createTask(groupId, "Tích hợp AI Agent");
    await tx.wait();
    console.log("✅ Đã tạo 3 Tasks thành công!");

    console.log("🎉 Seed dữ liệu cơ bản hoàn tất!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});