use anyhow::Result;
use std::env;

fn main() -> Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();
    docter_preview::cli::handle_command(args)
}