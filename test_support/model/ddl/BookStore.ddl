!Book
@IDBook
%GUIDBook
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Title 200
$Type 32
$Genre 128
$ISBN 64
$Language 12
$ImageURL 254
#PublicationYear

!BookAuthorJoin
@IDBookAuthorJoin
%GUIDBookAuthorJoin
#IDBook -> IDBook
#IDAuthor -> IDAuthor

!Author
@IDAuthor
%GUIDAuthor
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
$Name 200

!BookPrice
@IDBookPrice
%GUIDBookPrice
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
.Price 8,2
&StartDate
&EndDate
^Discountable
$CouponCode 16
#IDBook -> IDBook

!Review
@IDReviews
%GUIDReviews
&CreateDate
#CreatingIDUser
&UpdateDate
#UpdatingIDUser
^Deleted
&DeleteDate
#DeletingIDUser
*Text
#Rating
#IDBook -> IDBook
