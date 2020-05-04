import React from 'react';

import './App.css';

import BioSearch from './BioSearch.js';

import ReactGA from 'react-ga';


class App extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            height: 0,
            document_count: "(awaiting)",
            last_update: "(awaiting)"
        };
        this.headerElement = null;
        this.updateDimensions = this.updateDimensions.bind(this);
        this.fetch_index_documents = this.fetch_index_documents.bind(this);
    }

    updateDimensions(){
        this.setState({ height: this.headerElement.clientHeight });
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);

        ReactGA.initialize('UA-162298082-1');
        ReactGA.pageview(window.location.pathname + window.location.search);

        //change title
        document.title = "Covid-19 Search"

        // run the request
        this.fetch_index_documents()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    async fetch_index_documents(){

        try {
            let response = await fetch("http://covidsearch.web.ua.pt/api/esinfo", {
                method: 'GET',
                headers: {
                    'Access-Control-Allow-Origin' : '*',
                }
            });
            
            response = await response.json()

            this.setState({ document_count: response.indexed_documents.toString(),
                last_update: response.last_update
            });
        } catch (error) {
           console.log(error) 
        }

        
    }

    render(){
        return (
            <div className="App">
                <header className="App-header" ref={ (e) => this.headerElement = e}>
                    <p>Covid-19 Search </p>
                </header>
                <BioSearch parentHeight = {this.state.height}/>
                <footer className="App-footer">
                    This application searches {this.state.document_count} scientific articles from CORD-19 corpus. ( Last update: {this.state.last_update})
                    
                    <br/>
                    
                    Search architecture is based on "Calling attention to passages for biomedical question answering" ECIR 2020
                </footer>
            </div>
        );
    }
}

export default App;
