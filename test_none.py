def test_none_data():
    response_data = {"status": "success", "message": "...", "data": None}
    flw_data = response_data.get("data", {})
    try:
        amount = flw_data.get("amount", 0)
    except Exception as e:
        print("Exception:", type(e))

if __name__ == "__main__":
    test_none_data()
