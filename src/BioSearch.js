import React from 'react';
import ReactGA from 'react-ga';
import './biosearch.css';
import 'bootstrap/dist/css/bootstrap.css'
import { RingLoader } from 'react-spinners';
import ReactPaginate from 'react-paginate';

class BioSearch extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            waiting : false,
            query_data : "",
            documents_data : null,
            paginator: null,
            display_index: 0,
            page_count: 0,
            first_load:true,
            height: 0
        };
        this.input = null;
        this.max_docs_per_page= 10;

        this.index_example = 0;
        this.bioASQ_queries = ["Drugs to treat Covid-19?",
                               "Use of mask effective Covid-19?",
                               "Covid-19 vaccine",
                               "docking drugs for covid-19?",
                               "How to protect against COVID-19?",
                               "What is Covid-19?",
                               ];

        this.fetch_data = this.fetch_data.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.new_example = this.new_example.bind(this);
        this.updateWHDimensions = this.updateWHDimensions.bind(this);
        this.handlePageClick = this.handlePageClick.bind(this);
    }

    updateWHDimensions(){
        this.setState({ height: window.innerHeight });
    }
    componentDidMount() {
        this.updateWHDimensions();
        window.addEventListener('resize', this.updateWHDimensions);
        document.addEventListener("keydown", this.handleKeyDown, false);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWHDimensions);
        document.removeEventListener("keydown", this.handleKeyDown, false);
    }

    new_example(){
        this.input.value = this.bioASQ_queries[(this.index_example++)%this.bioASQ_queries.length]
    }

    handlePageClick(data){
        this.setState({ 
            display_index : data.selected
        });

    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.fetch_data();
        }
    }

    async fetch_data(){

        if (this.input.value === ""){
            console.log("Input must be not null");
            return;
        }

        if (this.state.waiting){
            console.log("One request at time");
            return;
        }

        if (this.state.first_load){this.state.first_load=false;}

        const local_body = JSON.stringify({query: this.input.value});

        this.setState({ waiting:true });

        ReactGA.event({
            category: "query",
            action: this.input.value,
        });

        const rawResponse = await fetch("http://covidsearch.web.ua.pt/api", {
            method: 'POST',
            headers: {
                'Access-Control-Allow-Origin' : '*',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: local_body
        });

        const content = await rawResponse.json();

        //prepare docs

        let docs = content.map((item,i) =>{
            
            let title = item.title
            let abstract = item.abstract
            
            let snippets = item.snippets.sort(function(a, b) {
                return b.end - a.end;
            });

            snippets.forEach(element => {
                if (element.section === "title"){
                    title = title.slice(0,element.end) +"</text>"+title.slice(element.end)
                    title = title.slice(0,element.start) +"<text style=background-color:hsl(220,100%,"+element.score+"%);>"+title.slice(element.start)
                }else{
                    // Not the best solution
                    abstract = abstract.slice(0,element.end) +"</text>"+abstract.slice(element.end)
                    abstract = abstract.slice(0,element.start) +"<text style=background-color:hsl(220,100%,"+element.score+"%);>"+abstract.slice(element.start)
                }
            });
            
            let identifier = ""
            let identifier_ref = "https://scholar.google.com/scholar?q="+item.title

            if (item.doi!==""){
                identifier = "DOI: " + item.doi
                identifier_ref = "https://dx.doi.org/"+item.doi
            }else if (item.pubmed_id!=="nan"){
                identifier = "PUBMED ID: " + item.pubmed_id
                identifier_ref = "https://www.ncbi.nlm.nih.gov/pubmed/"+item.pubmed_id
            }else if (item.pmcid!==""){
                identifier = "PMCID ID: " + item.pmcid
                identifier_ref = "https://www.ncbi.nlm.nih.gov/pmc/articles/"+item.pmcid
            }

            //const pmid =  item.pubmed_id==="nan"? "" : "PMID: " + item.pubmed_id
            //const pmcid =  item.pmcid===""? "" : "PMCID: " + item.pmcid



            return (<div key={"div_"+i} className="card Doc">
                        <div className="row card-header card-title" style={{marginLeft:0,marginRight:0}}>
                            <a href={identifier_ref} target="_blank" rel="noopener noreferrer" style={{color:"black"}}dangerouslySetInnerHTML={{__html: title}}></a>
                        </div>
                        <div className="card-body" style={{paddingBottom:2}}>
                            

                            <p key={"p_"+i} className="TokenizedDoc"dangerouslySetInnerHTML={{__html: abstract}} />
                        </div>
                        <footer className="row Card-footer">
                            
                            
                            <div className="col-sm-12" style={{paddingLeft:0,paddingRight:0}}> 
                                <a href={identifier_ref} rel="noopener noreferrer" target="_blank" style={{color:"black"}}>{identifier}</a> 
                            </div>
                            

                        </footer>

                    </div>
            );
        });
                
        const page_count = Math.floor(docs.length/this.max_docs_per_page)+(docs.length%this.max_docs_per_page===0?0:1)

        const pag = <ReactPaginate
                        previousLabel={'previous'}
                        nextLabel={'next'}
                        breakLabel={'...'}
                        breakClassName={'break-me'}
                        pageCount={page_count}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={this.handlePageClick}
                        containerClassName={'pagination'}
                        subContainerClassName={'pages pagination'}
                        activeClassName={'active'}
                        />

        this.setState({ 
            documents_data: docs,
            paginator: pag,
            page_count: page_count,
            display_index: 0,
            waiting:false,
        });
    }

    

    render() {
        let data = null;
        if (this.state.waiting){
            data = null;
        } else if (this.state.documents_data!==null){
            //<p dangerouslySetInnerHTML={{__html: this.state.query_data}}/>
            
            const _lower_docs_index = this.state.display_index*this.max_docs_per_page
            const _higher_docs_index = _lower_docs_index + this.max_docs_per_page

            data = (<div style={{marginBottom:20}}>
                        
                        <div className="Docs">
                            {this.state.documents_data.slice(_lower_docs_index, _higher_docs_index)}
                            {this.state.paginator}
                        </div>

                        
                    </div>);
        }

        const _marginTop = this.state.first_load ? (this.state.height/2 - this.props.parentHeight) : 20;
        const _marginBottom = this.state.first_load || this.state.waiting ? this.state.height - (_marginTop+this.props.parentHeight+38)-50 : 40;

        return (
            <div className="PageBody">
                <div style={{marginTop:_marginTop,marginBottom:_marginBottom}}>
                    <div className="input-group row" style={{marginLeft:0}}>
                        <div className="col-sm-12 col-md-7" style={{paddingRight:0, paddingLeft:0}}>
                            <input type="text" className="form-control" defaultValue="Drugs to treat Covid-19?" ref={(ref) => this.input= ref} disabled={this.state.waiting}
                                aria-label="Recipient's username" aria-describedby="button-addon2"/>
                        </div>
                        
                            <button onClick={this.new_example} className="btn btn-outline-secondary col-sm-8 col-md-3" type="button" id="button-addon2" disabled={this.state.waiting}>Other Example</button>
                        
                       
                            <button onClick={this.fetch_data} className="btn btn-outline-secondary col-sm-4 col-md-2" type="button" id="button-addon2" disabled={this.state.waiting}>Search</button>
                        
                    </div>
                </div>
                <div className="LoadingIcon">
                    <RingLoader size={100} loading={this.state.waiting}/>
                </div>
                {data}
            </div>
        );
    }
}

export default BioSearch;