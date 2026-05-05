# EcoDrop Reference Context

Use these sources before implementing production code:

- Task documents:
  - `/Users/macbook/Documents/coding/RekSTI/Tugas03/II3240 Template Tugas Deliverable 3.md`
  - `/Users/macbook/Documents/coding/RekSTI/Tugas02/Tugas 2_Kelompok 2.docx.md`
  - `/Users/macbook/Documents/coding/RekSTI/Tugas02/pembagian-tugas-deliverable-2.md`
- Final UI:
  - `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
  - `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`
- Architecture:
  - `/Users/macbook/Documents/coding/RekSTI/Tugas03/assets/ecodrop-system-architecture.puml`
  - `/Users/macbook/Documents/coding/RekSTI/Tugas03/assets/ecodrop-system-architecture.png`
- Presentation:
  - `/Users/macbook/Documents/coding/RekSTI/Tugas03/ppt_output/EcoDrop_Deliverable_3_Presentation_Revisi.pptx`
- Setorin code reference:
  - GitHub repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
  - Important folders: `app`, `backend`, `iot_simulator`, `setorin.ino`
  - IoT raw reference without temporary token: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`
  - Private file access command:
    ```bash
    gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
    ```
- Roboflow pretrained model:
  - Brand detection browse page: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`
- Figma:
  - `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`

Do not commit temporary GitHub raw `?token=...` URLs into source or docs. Use `gh` authentication or environment variables instead.

Implementation source of truth:

1. Deliverable 3 and the latest user prompt win over older Deliverable 2 placeholders.
2. Points must never be awarded after image validation alone.
3. A successful deposit requires image validation and SmartBin IR sensor confirmation.
4. Capacitor is the current mobile app direction, not PWA-only.
