module random_meal_picker::meal_picker {
    use iota::object;
    use iota::transfer;
    use iota::tx_context;

    /// Object lưu kết quả lựa chọn món ăn
    public struct MealChoice has key, store {
        id: object::UID,
        index: u64,
        seed: u64,
        user: address,
    }

    const ERandomInvalidCount: u64 = 1;

    /// Hàm entry chính:
    /// - meal_count: số lượng món ăn có thể chọn (frontend gửi lên)
    /// - seed: một số bất kỳ do người dùng cung cấp (pseudo-random đầu vào)
    /// Hàm sẽ tính toán index ngẫu nhiên và tạo một object MealChoice rồi
    /// chuyển object đó về địa chỉ người gọi.
    public fun pick_random(
        meal_count: u64,
        seed: u64,
        _ctx: &mut tx_context::TxContext
    ) {
        assert!(meal_count > 0, ERandomInvalidCount);

        // Linear congruential generator đơn giản (pseudo-random)
        let a: u64 = 1103515245;
        let c: u64 = 12345;
        let v = a * seed + c;
        let index = v % meal_count;

        let choice = MealChoice {
            id: object::new(_ctx),
            index,
            seed,
            user: tx_context::sender(_ctx),
        };

        transfer::public_transfer(choice, tx_context::sender(_ctx));
    }
}
