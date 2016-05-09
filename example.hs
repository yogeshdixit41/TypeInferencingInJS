mymap f [] = []
mymap f (first:rest) = f first : map f rest

addone :: Int -> Int
addone x = x + 1

main :: IO ()
main = do
  putStrLn $ show $ mymap addone [1,2,3,4]
