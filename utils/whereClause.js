// base - Model.find({value})
// bigQ - ?search=coder&page=2&category=summer&rating[gte]=4&price[lte]=999&price[gte]=499&limit=5
class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchWord = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};
    this.base = this.base.find({ ...searchWord });
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    // removing {search, page} params from the query, as we are handling it in search() and pager()
    delete copyQ["search"];
    delete copyQ["limit"];
    delete copyQ["page"];

    // convert bigQ to string => copyQ
    let stringOfCopyQ = JSON.stringify(copyQ);

    // regex - * if \b passed => will set the boundary and select olny the string passed,
    //           if not => ("car") will select both car and carpet
    //         * if /g passed => it'll select all the matching values
    //           if not => only selects the first match
    stringOfCopyQ = stringOfCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    // convert back to json
    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);
    this.base = this.base.find(jsonOfCopyQ);
    return this;
  }

  pager(resultPerPage) {
    let currentPage = this.bigQ.page ? this.bigQ.page : 1;
    const skipVal = resultPerPage * (currentPage - 1);

    this.base = this.base.limit(resultPerPage).skip(skipVal);
    return this;
  }
}

module.exports = WhereClause;
