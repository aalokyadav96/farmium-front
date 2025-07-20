import { apiFetch } from "../api/api";

export async function GetFileHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function (event) {
            const arrayBuffer = event.target.result;
            const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
            resolve(hashHex);
        };
        reader.onerror = () => reject("Error reading file");
        reader.readAsArrayBuffer(file);
    });
}

// async function handleFileUpload(file) {
//     let data = {};
//     try {
//         const fileHash = await GetFileHash(file);
//         console.log("File Hash:", fileHash);

//         // Check with the server if the file already exists
//         const response = await fetch("/api/check-file", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ hash: fileHash })
//         });

//         data = await response.json();
//         if (data.exists) {
//             // alert("File already exists. Using existing file.");
//             // console.log(data);
//             return data; // Return data if file already exists
//         }

//         // If not, proceed with the upload
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("hash", fileHash);

//         const uploadResponse = await fetch("/api/upload", {
//             method: "POST",
//             body: formData
//         });

//         const uploadData = await uploadResponse.json();
//         alert("File uploaded successfully!");
//         console.log(uploadData);

//         return uploadData; // Return the response data after successful upload

//     } catch (error) {
//         console.error("Error handling file:", error);
//     }

//     return data; // Ensure data is returned even if there's an error
// }

// return await handleFileUpload(file); // Return the result of handleFileUpload

// export async function CheckFile(file) {
//     let data = {exists: false, url: ""};
//     try {
//         const fileHash = await GetFileHash(file);
//         console.log("File Hash:", fileHash);

//         // Check with the server if the file already exists
//         const response = await fetch("/api/check-file", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ hash: fileHash })
//         });

//         data = await response.json();
//     } catch (error) {
//         console.error("Error handling file:", error);
//     }
//         return data
// }


export async function CheckFile(file) {
    let data = { exists: false, url: "" };
    try {
        const fileHash = await GetFileHash(file);
        console.log("File Hash:", fileHash);

        // Check with the server if the file already exists
        const response = await apiFetch(`/check-file/${fileHash}`);

        // data = await response.json();
        data = response;
    } catch (error) {
        console.error("Error handling file:", error);
    }
    return data
}


// // Example usage with an input field
// document.getElementById("fileInput").addEventListener("change", function (event) {
//     const file = event.target.files[0];
//     if (file) {
//         handleFileUpload(file);
//     }
// });
