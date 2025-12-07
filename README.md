# Random Meal Picker – Build on IOTA

Random Meal Picker là một dApp đơn giản chạy trên IOTA devnet.  
Người dùng kết nối ví IOTA, bấm nút **“Pick Meal”** để gọi smart contract Move `pick_random`, smart contract sẽ tạo một object **MealChoice** lưu index món ăn được chọn. Giao diện React/Next.js sẽ map index này sang tên món ăn hiển thị cho cả nhóm.

---

## 🚀 1. Prerequisites

Trước khi chạy dự án, hãy cài:

- **Node.js** ≥ 20.9.0
- **npm** (hoặc pnpm/yarn, ví dụ dùng npm trong README này)
- **IOTA CLI** (`iota`) đã kết nối devnet
- Một ví IOTA tương thích (IOTA wallet extension) để kết nối dApp

---

## 📦 2. Cài đặt & chạy frontend

Clone repo (hoặc tải source zip về và giải nén):

```bash
git clone <your-github-repo-url> random-meal-picker
cd random-meal-picker
npm install --legacy-peer-deps
npm run dev
Mặc định Next.js sẽ chạy ở: http://localhost:3000