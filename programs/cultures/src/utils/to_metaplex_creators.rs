use crate::state::*;
use spl_token_metadata;

// pub fn to_metaplex_creators(
//     creators: Option<Vec<Creator>>,
// ) -> Option<Vec<spl_token_metadata::state::Creator>> {
//     if let Some(creators) = creators {
//         let mut metaplex_creators: Vec<spl_token_metadata::state::Creator> = Vec::new();
//         for creator in creators.iter() {
//             let metaplex_creator = spl_token_metadata::state::Creator {
//                 address: creator.address,
//                 verified: true,
//                 share: creator.share,
//             };
//             metaplex_creators.push(metaplex_creator);
//         }
//         Some(metaplex_creators)
//     } else {
//         None
//     }
// }
