use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use std::str::from_utf8;

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Uncomment to see details of each account.
    // for a in accounts.iter() {
    //     msg!(
    //         "Owner: {}, PubKey:{}, exe: {}",
    //         a.owner,
    //         a.key,
    //         a.executable
    //     );
    // }

    // Create iterator over accounts
    let accounts_iter = &mut accounts.iter();

    // Get account data
    let account = next_account_info(accounts_iter)?;
    let signer = next_account_info(accounts_iter)?;

    // Verify account owner is the current program.
    if account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    verify_signature(signer)?;
    validate_instruction_data(instruction_data)?;

    // Write instruction data
    write_data(account, instruction_data, 0);

    // Zero out remaining space
    write_data(
        account,
        &vec![0; account.data_len() - instruction_data.len()],
        instruction_data.len(),
    );

    Ok(())
}

pub fn verify_signature(signer: &AccountInfo) -> Result<(), ProgramError> {
    if let Some(address) = signer.signer_key() {
        msg!("Signed by {:?}", address);
        Ok(())
    } else {
        Err(ProgramError::MissingRequiredSignature)
    }
}

pub fn validate_instruction_data(instruction_data: &[u8]) -> Result<(), ProgramError> {
    match from_utf8(instruction_data) {
        Ok(_) => Ok(()),
        Err(err) => {
            msg!(
                "Only UTF-8 characters supported. Invalid detected from {}",
                err.valid_up_to()
            );
            Err(ProgramError::InvalidInstructionData)
        }
    }
}

pub fn write_data(account: &AccountInfo, instruction_data: &[u8], offset: usize) -> () {
    let mut acc_data = account.data.borrow_mut();
    acc_data[offset..(offset + instruction_data.len())].copy_from_slice(instruction_data);
}

#[cfg(test)]
mod test {

    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_happy_path() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut signer_lamports = 1_000_000;
        let mut account_data = vec![0; mem::size_of::<u32>()];
        let mut signer_data = vec![0; mem::size_of::<u32>()];
        let signer_owner = Pubkey::default();

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut account_data,
            &program_id,
            false,
            Epoch::default(),
        );

        let signer = AccountInfo::new(
            &key,
            true,
            false,
            &mut signer_lamports,
            &mut signer_data,
            &signer_owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account, signer];

        let res = process_instruction(&program_id, &accounts, &vec![12, 24, 48]);
        assert_eq!(res, Ok(()));

        {
            let data = accounts[0].data.borrow();
            assert_eq!(*data, vec![12, 24, 48, 0]);
        }

        let res = process_instruction(&program_id, &accounts, &vec![22]);
        assert_eq!(res, Ok(()));

        {
            let data = accounts[0].data.borrow();
            assert_eq!(*data, vec![22, 0, 0, 0]);
        }
    }

    #[test]
    fn test_invalid_characters() {
        let invalid_instruction_data = vec![80, 114, 101, 231, 111];

        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut signer_lamports = 1_000_000;
        let mut account_data = vec![0; 1024 as usize];
        let mut signer_data = vec![0; mem::size_of::<u32>()];
        let signer_owner = Pubkey::default();

        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut account_data,
            &program_id,
            false,
            Epoch::default(),
        );

        let signer = AccountInfo::new(
            &key,
            true,
            false,
            &mut signer_lamports,
            &mut signer_data,
            &signer_owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account, signer];

        let res = process_instruction(&program_id, &accounts, &invalid_instruction_data);
        assert_eq!(res, Err(ProgramError::InvalidInstructionData));
    }
}
