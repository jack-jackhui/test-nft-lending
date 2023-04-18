from pyteal import *
from algosdk.v2client import algod, indexer


algod_address_c = 'https://testnet-algorand.api.purestake.io/ps2'
algod_token_c = '1nYJyGUcqI4QNR7ChogoU2839CD3Osh7a6EVEBtv'

algod_address = algod_address_c
algod_token = algod_token_c
headers = {
    "X-API-Key": algod_token,
}

# Initialize an algod client
algod_client = algod.AlgodClient(algod_token, algod_address, headers)

# Get suggested parameters
params = algod_client.suggested_params()
params.fee = 1000
params.flat_fee = True

usdc_asset_id = 10458941  # Replace with actual USDC asset ID on Algorand
ALGO_ID = 0

# create a list of allowed NFTs
allowed_nfts = [
    "goan001", "goan002", "goan003",  # Replace these with the actual Meta Unit Names
    # ...
]
# Retrieve the asset info of the asset
"""
asset_info = algod_client.asset_info(usdc_asset_id)
asset_params: Dict[str, Any] = asset_info["params"]
print(f"Asset Name: {asset_params['name']}")
print(f"Asset params: {list(asset_params.keys())}")
"""

escrow_account_address = "W6LFOP4F3MNOTAVJD5SI4T442BUF4DVIOS3YOVW56NQ55AL3VYP7F22FEM"
escrow_account_private_key = "2ChjTAjq2jonx2G8BK50GXjm202bdL1djcMv0yyU/2W3llc/hdsa6YKpH2SOT5zQaF4OqHS3h1bd82HegXuuHw=="
owner_account_address = "ZBBJH4QBZB2QMSWWUL4DXKEAWIHBYMPXGV46KDFP3XF2D6E7J4I26P57UY"
owner_account_private_key = "D7MnBSbL0TLbzniYT3ST2HsKmy+u1oaPmxcfiguqQsrIQpPyAch1BkrWovg7qICyDhwx9zV55Qyv3cuh+J9PEQ=="

# Constants and reusable variables
R0 = Int(100)
R1 = Int(1000)
R2 = Int(10000)
optimal_utilization_rate = Int(7000)
reserve_ratio = Int(1000)

def is_allowed_meta_unit_name(meta_unit_name: str) -> Expr:
    checks = [meta_unit_name == Bytes(name) for name in allowed_nfts]
    return Or(*checks)
"""
def is_valid_amount(amount: int) -> Expr:
    return amount % Int(10000) == Int(0)
"""

def usdc_deposit_withdrawal_contract(receiver: Addr, min_amount: int):

    # OnCreate sequence
    handle_create = Seq([
        App.globalPut(Bytes("t_d"), Int(0)),
        App.globalPut(Bytes("u_rate"), Int(0)),
        App.globalPut(Bytes("b_int_rate"), Int(0)),
        App.globalPut(Bytes("d_int_rate"), Int(0)),
        Return(Int(1))
    ])

    # Utilization rate calculation
    t_d = App.globalGet(Bytes("t_d"))
    utilization_rate = If(
        Or(t_d == Int(0), App.globalGet(Bytes("t_b")) == Int(0)),
        Int(0),
        Div(Mul(t_d, Int(10000)), App.globalGet(Bytes("t_b")))
    )
    #utilization_rate = Div(Mul(App.globalGet(Bytes("t_b")), Int(10000)), App.globalGet(Bytes("t_d")))
    update_utilization_rate = App.globalPut(Bytes("u_rate"), utilization_rate)

    # Interest rate calculation
    interest_rate = If(
        App.globalGet(Bytes("t_d")) == Int(0),
        Int(500),
        If(
            utilization_rate <= optimal_utilization_rate,
            Add(R0, Div(Mul(utilization_rate, R1), optimal_utilization_rate)),
            Add(Add(R0, R1),
                Div(Mul(utilization_rate - optimal_utilization_rate, R2), Int(10000) - optimal_utilization_rate))
        )
    )

    update_interest_rate = App.globalPut(Bytes("b_int_rate"), interest_rate)

    # Deposit interest rate calculation
    deposit_interest_rate = Div(Mul(utilization_rate, interest_rate) * (Int(10000) - reserve_ratio), Int(10000))
    update_deposit_rate = App.globalPut(Bytes("d_int_rate"), deposit_interest_rate)

    # Store the operation type (True if deposit, False if withdraw):
    is_deposit = Gtxn[0].application_args[0] == Bytes("deposit")

    handle_deposit_withdraw = Seq([
        Assert(Or(Gtxn[0].application_args[0] == Bytes("deposit"), Gtxn[0].application_args[0] == Bytes("withdraw"))),
        Assert(Gtxn[1].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[1].xfer_asset() == Int(usdc_asset_id)),
        If(is_deposit, Assert(Gtxn[1].asset_amount() >= Int(min_amount))),
        App.localPut(Int(0), Bytes("d_amt"),
                     If(is_deposit, App.localGet(Int(0), Bytes("d_amt")) + Gtxn[1].asset_amount(),
                        App.localGet(Int(0), Bytes("d_amt")) - Gtxn[1].asset_amount())),
        App.localPut(Int(0), Bytes("e_int"),
                     Div(Mul(App.localGet(Int(0), Bytes("d_amt")), deposit_interest_rate), Int(10000))),
        App.globalPut(Bytes("t_d"), If(is_deposit, App.globalGet(Bytes("t_d")) + Gtxn[1].asset_amount(),
                                       App.globalGet(Bytes("t_d")) - Gtxn[1].asset_amount())),
        If(Not(is_deposit), Assert(Gtxn[1].receiver() == Txn.sender())),
        If(Not(is_deposit), Assert(Gtxn[1].asset_amount() <= App.localGet(Int(0), Bytes("d_amt")))),
        update_utilization_rate,
        update_deposit_rate,
        update_interest_rate,
        Int(1)
    ])

    handle_update_utilization_rate = Seq([
        Assert(Gtxn[0].application_args[0] == Bytes("update_utilization_rate")),
        Assert(Txn.sender() == App.globalGet(Bytes("collateral_contract"))),
        App.globalPut(Bytes("u_rate"), Gtxn[0].application_args[1]),
        Return(Int(1))
    ])

    handle_query_total_deposit = Seq([
        Assert(Gtxn[0].application_args[0] == Bytes("query_total_deposit")),
        App.globalPut(Bytes("q_t_d"), App.globalGet(Bytes("t_d"))),
        Return(Int(1))
    ])

    handle_update_interest_rate = Seq([
        Assert(Gtxn[0].application_args[0] == Bytes("update_interest_rate")),
        Assert(Txn.sender() == App.globalGet(Bytes("collateral_contract"))),
        App.globalPut(Bytes("u_rate"), Gtxn[0].application_args[1]),
        Return(Int(1))
    ])

    handle_optin = Seq([
        Assert(Txn.application_args.length() == Int(0)),
        App.localPut(Int(0), Bytes("opted_in"), Int(1)),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), handle_create],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [handle_deposit_withdraw, Return(Int(1))],
        [Gtxn[0].application_args[0] == Bytes("update_utilization_rate"), handle_update_utilization_rate],
        [Gtxn[0].application_args[0] == Bytes("query_total_deposit"), handle_query_total_deposit]
    )
    return program

def clear_state_program():
    return Seq([
        Return(Int(1))
    ])

if __name__ == "__main__":
    receiver = Addr(escrow_account_address)  # Replace with the actual receiver address
    min_amount = 1000000  # Minimum deposit amount in microUSDC

    # Compile the contract
    usdc_deposit_program = usdc_deposit_withdrawal_contract(receiver, min_amount)
    usdc_deposit_clear_program = clear_state_program()

    usdc_app_teal = compileTeal(usdc_deposit_program, mode=Mode.Application, version=4)
    usdc_clear_teal = compileTeal(usdc_deposit_program, mode=Mode.Application, version=4)

    with open("usdc_deposit.teal", "w") as app_file:
        app_file.write(usdc_app_teal)

    with open("usdc_deposit_clear_state.teal", "w") as clear_file:
        clear_file.write(usdc_clear_teal)

    """
    PyTeal code block for reuse:
    
        # Deposit condition and sequence
    handle_deposit = Seq([
        Assert(Gtxn[0].application_args[0] == Bytes("deposit")),
        Assert(Gtxn[1].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[1].xfer_asset() == Int(usdc_asset_id)),
        Assert(Gtxn[1].asset_amount() >= Int(min_amount)),
        App.localPut(Int(0), Bytes("d_amt"), App.localGet(Int(0), Bytes("d_amt")) + Gtxn[1].asset_amount()),
        App.localPut(Int(0), Bytes("e_int"),
                     Div(Mul(App.localGet(Int(0), Bytes("d_amt")), deposit_interest_rate), Int(10000))),
        App.globalPut(Bytes("t_d"), App.globalGet(Bytes("t_d")) + Gtxn[1].asset_amount()),
        update_utilization_rate,
        update_deposit_rate,
        update_interest_rate,
        Int(1)
    ])

    # Withdraw condition and sequence
    handle_withdraw = Seq([
        Assert(Gtxn[0].application_args[0] == Bytes("withdraw")),
        Assert(Gtxn[1].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[1].xfer_asset() == Int(usdc_asset_id)),
        Assert(Gtxn[1].receiver() == Txn.sender()),
        Assert(Gtxn[1].asset_amount() <= App.localGet(Int(0), Bytes("d_amt"))),
        #Assert(is_valid_amount(Gtxn[1].asset_amount())),
        App.localPut(Int(0), Bytes("d_amt"), App.localGet(Int(0), Bytes("d_amt")) - Gtxn[1].asset_amount()),
        App.localPut(Int(0), Bytes("e_int"),
                     Div(Mul(App.localGet(Int(0), Bytes("d_amt")), deposit_interest_rate), Int(10000))),
        App.globalPut(Bytes("t_d"), App.globalGet(Bytes("t_d")) - Gtxn[1].asset_amount()),
        update_utilization_rate,
        update_deposit_rate,
        update_interest_rate,
        Int(1)
    ])
    
    """