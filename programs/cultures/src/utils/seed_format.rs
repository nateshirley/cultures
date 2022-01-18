pub trait SeedFormat {
    fn to_seed_format(self) -> String;
}
//need to add some error handling to the front end
impl SeedFormat for String {
    //checks for length and special chars
    fn to_seed_format(mut self) -> String {
        self.make_ascii_lowercase();
        self.retain(|c| !c.is_whitespace());
        self
    }
}
